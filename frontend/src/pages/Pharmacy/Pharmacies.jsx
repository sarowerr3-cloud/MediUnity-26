import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Pill, ShoppingBag, Plus, Minus, ArrowLeft, Phone, Search, MapPin, Truck, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useUser } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ReviewsModal from "../../components/Reviews/ReviewsModal";
import MapViewer from "../../components/Map/MapViewer";
import { calculateDistance } from "../../utils/distance";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = axios.create({ baseURL: API_BASE });

export default function PharmaciesPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("id") || queryParams.get("hospitalId");

  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [ads, setAds] = useState([]);

  // Pharmacy detail & Cart states
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cart, setCart] = useState({}); // { medicineName: { medicineName, price, quantity } }
  const [prescriptionId, setPrescriptionId] = useState(null);
  
  // Checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Cumilla");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [paymentMode, setPaymentMode] = useState("COD");
  const [mfsProvider, setMfsProvider] = useState("bkash");
  const [mfsNumber, setMfsNumber] = useState("");
  const [mfsTrxId, setMfsTrxId] = useState("");

  // Reviews states
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsTarget, setReviewsTarget] = useState(null);

  const loadPharmacies = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get("/api/patients/pharmacies");
      if (resp.data?.success) {
        setPharmacies(resp.data.pharmacies || []);
      }
    } catch (err) {
      console.error("Failed to load pharmacies:", err);
      toast.error("Failed to load pharmacies list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPharmacies();
  }, [loadPharmacies]);

  useEffect(() => {
    async function fetchAds() {
      try {
        const resp = await axios.get(`${API_BASE}/api/patients/ads/active`);
        if (resp.data?.success) {
          setAds(resp.data.ads || []);
        }
      } catch (err) {
        console.warn("Failed to fetch campaigns:", err);
      }
    }
    fetchAds();
  }, []);

  useEffect(() => {
    if (highlightId && pharmacies.length > 0) {
      const match = pharmacies.find(p => p._id === highlightId);
      if (match) {
        setSelectedPharmacy(match);
      }
    }
  }, [highlightId, pharmacies]);

  useEffect(() => {
    if (pharmacies.length > 0) {
      const savedCartStr = localStorage.getItem("prescription_checkout_cart");
      const savedPrescriptionId = localStorage.getItem("prescription_checkout_id");
      
      if (savedCartStr) {
        try {
          const parsed = JSON.parse(savedCartStr);
          if (parsed && Object.keys(parsed).length > 0) {
            // Merge matching inventory prices if available in the first pharmacy
            const firstPharmacy = pharmacies[0];
            const updatedCart = { ...parsed };
            
            Object.keys(updatedCart).forEach(medName => {
              const invItem = firstPharmacy?.inventory?.find(
                i => i.medicineName.toLowerCase() === medName.toLowerCase()
              );
              if (invItem) {
                updatedCart[medName].price = invItem.pricePerUnit;
              }
            });

            setCart(updatedCart);
            setSelectedPharmacy(firstPharmacy);
            if (savedPrescriptionId) {
              setPrescriptionId(savedPrescriptionId);
            }
            toast.success("Prescription medicines loaded! Please review and complete your order.");
          }
        } catch (e) {
          console.error("Failed to parse prescription cart:", e);
        } finally {
          localStorage.removeItem("prescription_checkout_cart");
          localStorage.removeItem("prescription_checkout_id");
        }
      }
    }
  }, [pharmacies]);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Unable to retrieve location. Please allow access.");
        setLocationLoading(false);
      }
    );
  };

  const addToCart = (med) => {
    if (med.stock <= 0) {
      toast.error("Medicine out of stock!");
      return;
    }

    setCart(prev => {
      const currentQty = prev[med.medicineName]?.quantity || 0;
      if (currentQty >= med.stock) {
        toast.error(`Only ${med.stock} units available in stock.`);
        return prev;
      }
      return {
        ...prev,
        [med.medicineName]: {
          medicineName: med.medicineName,
          price: med.pricePerUnit,
          quantity: currentQty + 1
        }
      };
    });
  };

  const addOneToCart = (itemName) => {
    const invItem = selectedPharmacy?.inventory?.find(i => i.medicineName === itemName);
    if (invItem) {
      addToCart(invItem);
    } else {
      setCart(prev => {
        const current = prev[itemName];
        if (!current) return prev;
        return {
          ...prev,
          [itemName]: {
            ...current,
            quantity: current.quantity + 1
          }
        };
      });
    }
  };

  const removeFromCart = (medName) => {
    setCart(prev => {
      const current = prev[medName];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[medName];
        return copy;
      }
      return {
        ...prev,
        [medName]: {
          ...current,
          quantity: current.quantity - 1
        }
      };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const cartItems = Object.values(cart);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to order medicines.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!deliveryStreet || !deliveryCity) {
      toast.error("Please specify a delivery address.");
      return;
    }

    if (paymentMode === "MFS") {
      if (!mfsNumber || !mfsTrxId) {
        toast.error("Please enter MFS account number and transaction ID.");
        return;
      }
      if (mfsNumber.length < 11) {
        toast.error("Please enter a valid 11-digit MFS number.");
        return;
      }
    }

    setSubmittingOrder(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        pharmacyId: selectedPharmacy._id,
        prescriptionId: prescriptionId || undefined,
        items: cartItems.map(item => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        deliveryAddress: {
          street: deliveryStreet,
          city: deliveryCity
        },
        paymentStatus: paymentMode === "MFS" ? "Paid" : "Unpaid"
      };
      
      const resp = await API.post("/api/patients/bookings/pharmacy-order", payload, { headers });
      if (resp.data?.success) {
        toast.success(`🎉 Order placed successfully! Tracking Serial: ${resp.data.order?.serialNumber || ""}`);
        setShowCheckoutModal(false);
        setSelectedPharmacy(null);
        setCart({});
        setPrescriptionId(null);
        setDeliveryStreet("");
        setMfsNumber("");
        setMfsTrxId("");
        setPaymentMode("COD");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place pharmacy order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredPharmacies = useMemo(() => {
    let filtered = pharmacies.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.street?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (userLocation) {
      filtered = filtered.map(p => {
        let distance = null;
        if (p.locationGeo?.coordinates?.length === 2 && p.locationGeo.coordinates[0] !== 0) {
          const docLng = p.locationGeo.coordinates[0];
          const docLat = p.locationGeo.coordinates[1];
          distance = calculateDistance(userLocation.lat, userLocation.lng, docLat, docLng);
        }
        return { ...p, distance };
      }).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return filtered;
  }, [pharmacies, searchQuery, userLocation]);

  const mapLocations = filteredPharmacies.filter(p => p.locationGeo?.coordinates?.length === 2 && p.locationGeo.coordinates[0] !== 0).map(p => ({
    lat: p.locationGeo.coordinates[1],
    lng: p.locationGeo.coordinates[0],
    name: p.name,
    popup: p.address?.street || p.address?.city || 'Location'
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24">
        {/* Header Section */}
        {selectedPharmacy ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <button 
                onClick={() => { setSelectedPharmacy(null); setCart({}); }} 
                className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition text-sm font-semibold mb-3 cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Pharmacies List
              </button>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-serif">{selectedPharmacy.name}</h1>
              <p className="text-slate-500 mt-1.5 text-sm">Select medicines from the catalog to build your order.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-orange-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none" />
            
            <div className="relative">
              <Link to="/services" className="inline-flex items-center gap-1 text-slate-500 hover:text-orange-600 transition text-sm font-semibold mb-3">
                <ArrowLeft size={16} /> Back to Services
              </Link>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-serif">Partner Pharmacies</h1>
              <p className="text-slate-500 text-sm font-medium mt-2 max-w-lg">Order verified pharmaceuticals with home delivery from our trusted network.</p>
            </div>

            <div className="relative w-full md:max-w-md flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
                <input
                  type="text"
                  placeholder="Search pharmacies by name, city, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleFindNearest}
                  disabled={locationLoading}
                  className="px-4 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm border border-orange-700 shrink-0 flex-1 sm:flex-none disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  {locationLoading ? "Finding..." : "Nearest"}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                  className="px-5 py-3.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm border border-orange-200 shrink-0 flex-1 sm:flex-none"
                >
                  <MapPin className="w-4 h-4" />
                  {viewMode === 'list' ? "Map" : "List"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse text-sm">
            Loading pharmacy network...
          </div>
        ) : !selectedPharmacy ? (
          /* PHARMACY LIST OR MAP VIEW */
          filteredPharmacies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No pharmacies match your search criteria.</p>
              <button onClick={() => setSearchQuery("")} className="mt-4 px-6 py-2.5 bg-orange-50 text-orange-700 font-bold text-xs rounded-xl hover:bg-orange-100 transition cursor-pointer">Clear Filters</button>
            </div>
          ) : viewMode === 'map' ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[600px] w-full">
               <MapViewer locations={mapLocations} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPharmacies.map((pharm) => (
                <div key={pharm._id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg uppercase shrink-0 border border-orange-100/50">
                        {pharm.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 leading-tight">{pharm.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                          📞 Phone: {pharm.phone || "Not specified"}
                        </p>
                        {pharm.distance !== undefined && pharm.distance !== null && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            <MapPin size={10} />
                            {pharm.distance.toFixed(1)} km away
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">{pharm.rating ? pharm.rating.toFixed(1) : "0.0"}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewsTarget({ id: pharm._id, name: pharm.name, type: "Pharmacy" });
                              setShowReviewsModal(true);
                            }}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-transparent border-none cursor-pointer hover:underline"
                          >
                            ({pharm.reviewsCount || 0} reviews)
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Verified dispenser supplying prescription medicines and healthcare products.</p>
                  </div>

                  <button
                    onClick={() => setSelectedPharmacy(pharm)}
                    className="w-full mt-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition shadow-xs hover:shadow-sm cursor-pointer text-center"
                  >
                    Browse Medicines
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* MEDICINE CATALOG / ORDER WORKFLOW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Catalog Grid */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Pharmacy Details Panel (Facilities Info) */}
              {/* Premium Minimalist Header details */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex gap-4 items-center justify-between flex-wrap">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-md uppercase border border-orange-100/50">
                      {selectedPharmacy.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-md font-extrabold text-slate-800 flex items-center gap-1.5 leading-tight">
                        {selectedPharmacy.name}
                        <span className="bg-orange-500 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white border border-orange-400/30 tracking-wider">Pharmacy Page</span>
                      </h2>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap text-[10px]">
                        <p className="text-slate-400 font-semibold">
                          ⭐ {selectedPharmacy.rating ? selectedPharmacy.rating.toFixed(1) : "0.0"} ({selectedPharmacy.reviewsCount || 0} reviews)
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${selectedPharmacy.name}, Cumilla`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-orange-600 hover:underline flex items-center gap-0.5 font-bold transition cursor-pointer"
                        >
                          📍 Cumilla, Bangladesh
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Facilities Hot</p>
                    <a href={`tel:${selectedPharmacy.phone}`} className="text-xs font-extrabold text-slate-700 mt-0.5 flex items-center gap-1 hover:underline">
                      <Phone size={12} className="text-orange-600" /> {selectedPharmacy.phone}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <Truck size={14} className="text-orange-500 shrink-0" />
                    <span>Home Delivery coverage city-wide.</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <Pill size={14} className="text-orange-500 shrink-0" />
                    <span>Registered pharmacist assistance on duty.</span>
                  </div>
                  </div>
              </div>

              {/* Offers/Promotions Banner */}
              {ads.filter(ad => ad.hospitalId === selectedPharmacy._id).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promotional Offers</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {ads.filter(ad => ad.hospitalId === selectedPharmacy._id).map(ad => (
                      <div key={ad._id} className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 flex gap-4 items-start">
                        {ad.imageUrl && (
                          <img src={ad.imageUrl} alt="Offer" className="w-16 h-16 rounded-xl object-cover border shrink-0" />
                        )}
                        <div>
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">SPECIAL OFFER</span>
                          <h5 className="font-bold text-slate-800 text-xs mt-1">{ad.title}</h5>
                          <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{ad.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-md font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Medicine Catalog</h3>
              {(!selectedPharmacy.inventory || selectedPharmacy.inventory.length === 0) ? (
                <p className="text-slate-400 text-xs italic">No medicines available in stock at this pharmacy.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedPharmacy.inventory.map((med, index) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex justify-between items-center gap-4 hover:shadow-sm transition">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-sm truncate">{med.medicineName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Generic: {med.genericName || "Unspecified"}</p>
                        <p className="text-xs font-bold text-emerald-700 mt-2">{med.pricePerUnit} BDT / unit</p>
                        <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${med.stock > 0 ? "text-slate-400" : "text-red-500"}`}>
                          {med.stock > 0 ? `In Stock: ${med.stock}` : "Out of Stock"}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => addToCart(med)}
                        disabled={med.stock <= 0}
                        className="p-2.5 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart Sidebar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 sticky top-28">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-orange-600" /> Order Cart
                </h3>
                {cartItems.length > 0 && (
                  <button onClick={clearCart} className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase transition cursor-pointer">
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Your cart is empty. Click "+" to add items.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart list */}
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.medicineName} className="py-3 flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{item.medicineName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.price} BDT per unit</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border rounded-xl overflow-hidden">
                            <button onClick={() => removeFromCart(item.medicineName)} className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer">
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => addOneToCart(item.medicineName)}
                              className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="font-extrabold text-xs text-slate-700 min-w-[50px] text-right">
                            {item.price * item.quantity} BDT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-600 uppercase text-[9px] tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Free Delivery</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2.5 font-extrabold text-sm text-slate-800">
                      <span>Total Amount</span>
                      <span className="text-orange-600">{totalAmount} BDT</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck size={14} /> Proceed to Delivery
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {showCheckoutModal && selectedPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-200 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Medicine Checkout</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
              <div className="bg-slate-50 border p-4 rounded-2xl text-xs space-y-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Dispenser Pharmacy</p>
                <p className="font-bold text-slate-800 text-sm">{selectedPharmacy.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">Items Count: {cartItems.length} meds</p>
                <p className="font-extrabold text-orange-600 text-sm mt-1">Payable amount: {totalAmount} BDT (COD)</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivery Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 44, Road 5, Kandirpar"
                  value={deliveryStreet}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                  className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Delivery City</label>
                <select
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="Cumilla">Cumilla City</option>
                  <option value="Dhaka">Dhaka City</option>
                  <option value="Chittagong">Chittagong City</option>
                </select>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("COD")}
                    className={`py-2 px-3 border-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      paymentMode === "COD"
                        ? "border-orange-500 bg-orange-50/50 text-orange-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    💵 Cash On Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("MFS")}
                    className={`py-2 px-3 border-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                      paymentMode === "MFS"
                        ? "border-orange-500 bg-orange-50/50 text-orange-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    📱 Mobile Banking
                  </button>
                </div>
              </div>

              {paymentMode === "COD" ? (
                <div className="bg-orange-50/50 border border-orange-200/50 p-3 rounded-2xl text-[10px] text-orange-800 leading-normal flex items-start gap-2">
                  <Truck className="w-4 h-4 shrink-0 mt-0.5 text-orange-600" />
                  <span>Orders are dispatched via standard pharmacy rider service. Payment mode is Cash On Delivery (COD).</span>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 border p-3 rounded-2xl">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bkash", name: "bKash", color: "border-pink-500 bg-pink-50 text-pink-700", logo: "🇧🇩" },
                      { id: "nagad", name: "Nagad", color: "border-orange-500 bg-orange-50 text-orange-700", logo: "🔥" },
                      { id: "rocket", name: "Rocket", color: "border-purple-500 bg-purple-50 text-purple-700", logo: "🚀" }
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setMfsProvider(provider.id)}
                        className={`flex flex-col items-center justify-center py-2 px-1 border-2 rounded-xl transition text-[10px] font-bold cursor-pointer ${
                          mfsProvider === provider.id 
                            ? provider.color + " ring-1 ring-orange-500" 
                            : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        <span className="text-base">{provider.logo}</span>
                        <span className="mt-0.5">{provider.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-2 bg-white rounded-xl border text-[9px] text-slate-500 leading-tight">
                    💡 Please send <strong>{totalAmount} BDT</strong> to Merchant wallet: <span className="font-mono text-slate-800 font-bold">01799988877</span> (Merchant Pay/Send Money).
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Sender Mobile No</label>
                      <input
                        type="tel"
                        maxLength={11}
                        placeholder="e.g. 017XXXXXXXX"
                        value={mfsNumber}
                        onChange={(e) => setMfsNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full border rounded-lg p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Transaction ID (TrxID)</label>
                      <input
                        type="text"
                        placeholder="e.g. K9B7X2Y8"
                        value={mfsTrxId}
                        onChange={(e) => setMfsTrxId(e.target.value.toUpperCase())}
                        className="w-full border rounded-lg p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
              >
                {submittingOrder ? "Confirming Order..." : "Confirm & Place Order"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReviewsModal && reviewsTarget && (
        <ReviewsModal
          targetId={reviewsTarget.id}
          targetName={reviewsTarget.name}
          targetType={reviewsTarget.type}
          onClose={() => {
            setShowReviewsModal(false);
            setReviewsTarget(null);
          }}
          onReviewSubmitted={(newAvg, newCount) => {
            setPharmacies(prev => prev.map(p => p._id === reviewsTarget.id ? { ...p, rating: newAvg, reviewsCount: newCount } : p));
          }}
        />
      )}

      <Footer />
    </div>
  );
}
