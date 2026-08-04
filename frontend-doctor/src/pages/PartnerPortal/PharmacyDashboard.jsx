import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, ClipboardList, Package, PlusCircle, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState(null);
  const [orders, setOrders] = useState([]);
  const [medName, setMedName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [orderStatusUpdateId, setOrderStatusUpdateId] = useState("");
  const [orderStatusValue, setOrderStatusValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("partnerToken_v1");
    if (!token) return navigate("/partner-portal");
    try {
      const res = await axios.get(`${API_URL}/api/pharmacies/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPharmacy(res.data.pharmacy);
        fetchOrders(token);
      }
    } catch (err) {
      localStorage.clear();
      navigate("/partner-portal");
    }
  };

  const fetchOrders = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/pharmacies/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.post(`${API_URL}/api/pharmacies/medicine`,
        { medicineName: medName, genericName, stock: Number(stock), pricePerUnit: Number(price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Medicine added to inventory successfully!");
        setMedName("");
        setGenericName("");
        setStock("");
        setPrice("");
        setPharmacy(res.data.pharmacy);
      }
    } catch (err) {
      setError("Failed to add medicine to inventory.");
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!orderStatusUpdateId || !orderStatusValue) return;
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.put(`${API_URL}/api/pharmacies/order-status`,
        { orderId: orderStatusUpdateId, orderStatus: orderStatusValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Order status updated successfully!");
        setOrderStatusUpdateId("");
        setOrderStatusValue("");
        fetchOrders(token);
      }
    } catch (err) {
      setError("Failed to update order status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/partner-portal");
  };

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <p>Loading Pharmacy Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-300">
      
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="font-bold text-lg text-white">{pharmacy.name}</h1>
            <p className="text-xs text-slate-400">Pharmacy Operations Board</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-950 border border-red-500/30 hover:bg-red-900 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Alerts */}
        {(message || error) && (
          <div className="col-span-1 md:col-span-2">
            {message && (
              <div className="p-3 bg-teal-900/20 border border-teal-500/30 rounded-xl text-teal-400 text-xs">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Card: Add Medicine */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-md font-bold text-cyan-400 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Stock New Medicine
          </h2>
          <form onSubmit={handleAddMedicine} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="Napa Extra"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Generic Formula</label>
                <input
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="Paracetamol"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Stock (Units)</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Price per Unit (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="2.50"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Add to Stock List
            </button>
          </form>
        </div>

        {/* Card: Update Orders */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-md font-bold text-cyan-400 flex items-center gap-2">
            <Package className="w-5 h-5" /> Dispense Pharmacy Orders
          </h2>
          <form onSubmit={handleUpdateOrderStatus} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Order ID</label>
              <select
                value={orderStatusUpdateId}
                onChange={(e) => setOrderStatusUpdateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-teal-500 text-slate-300"
              >
                <option value="">-- Choose active order --</option>
                {orders
                  .filter((o) => o.orderStatus !== "Delivered")
                  .map((o) => (
                    <option key={o._id} value={o._id}>
                      UID: {o.patientId.slice(0, 10)}... | Bill: {o.totalAmount} BDT | Status: {o.orderStatus}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Transition Status</label>
              <select
                value={orderStatusValue}
                onChange={(e) => setOrderStatusValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-teal-500 text-slate-300"
              >
                <option value="">-- Choose status --</option>
                <option value="Preparing">Preparing</option>
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="OutForDelivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Update Order Status
            </button>
          </form>
        </div>

        {/* Card: Inventory Stock list */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-md font-bold text-cyan-400">Inventory Catalog ({pharmacy.inventory?.length || 0})</h2>
          
          {/* Low Stock Alerts */}
          {pharmacy.inventory?.filter(m => m.stock < 10).length > 0 && (
            <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl mb-4">
              <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Low Stock Alerts
              </h3>
              <div className="space-y-1.5">
                {pharmacy.inventory.filter(m => m.stock < 10).map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-300 font-semibold">{m.medicineName}</span>
                    <span className="text-red-400 font-bold bg-red-950 px-2 py-0.5 rounded border border-red-500/20">{m.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pharmacy.inventory?.length === 0 ? (
            <p className="text-xs text-slate-500">No medicines in inventory yet.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {pharmacy.inventory.map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white text-sm">{m.medicineName}</p>
                    <p className="text-slate-400 mt-0.5">{m.genericName || "Generic formula"}</p>
                    <p className="text-[10px] text-yellow-500 mt-1 font-sans">Stock: {m.stock} Units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-teal-400">{m.pricePerUnit} BDT / tab</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card: Dispatch Order Logs */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-md font-bold text-cyan-400 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Dispatch Order Logs ({orders.length})
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {orders.length === 0 ? (
              <p className="text-xs text-slate-500">No orders logged yet.</p>
            ) : (
              orders.map((o) => (
                <div key={o._id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-300">Patient: {o.patientId.slice(0, 12)}...</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.orderStatus === "Delivered" ? "bg-teal-950 border border-teal-500 text-teal-400" : "bg-yellow-950 border border-yellow-500 text-yellow-400"}`}>
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="mt-1.5 text-slate-400">Items: {o.items?.map(i => `${i.medicineName} (x${i.quantity})`).join(", ")}</p>
                  <p className="mt-1 text-cyan-400 font-bold">Total: {o.totalAmount} BDT</p>
                  {o.deliveryAddress && (
                    <p className="mt-1 text-slate-500 text-[10px]">Delivery: {o.deliveryAddress.street}, {o.deliveryAddress.city}</p>
                  )}
                  {o.prescriptionId && (
                    <div className="mt-2.5">
                      <a href={`/patient/prescriptions`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900 px-2.5 py-1 rounded transition cursor-pointer font-bold">
                        <ClipboardList className="w-3 h-3" /> Verify Prescription Attached
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
