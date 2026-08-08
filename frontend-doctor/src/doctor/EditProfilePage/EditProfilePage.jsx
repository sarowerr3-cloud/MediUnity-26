import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2,
  Save,
  X,
  Plus,
  Calendar,
  Clock,
  Image as ImageIcon,
  Check,
  Trash,
  Star,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Banknote,
  RefreshCw,
  Copy,
  UserCheck,
  Camera,
  ArrowLeft
} from "lucide-react";
import { editProfilePageStyles, iconSize } from "../../assets/dummyStyles";

const STORAGE_KEY = "doctorToken_v1";

/* ----------------- helpers ----------------- */
function parse12HourTimeToMinutes(t) {
  if (!t) return 0;
  const [time, ampm] = t.split(" ");
  const [hh, mm] = time.split(":");
  let h = Number(hh) % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + Number(mm);
}

function formatTimeFromInput(time24) {
  if (!time24) return time24;
  const [h, m] = time24.split(":");
  let hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${m} ${ampm}`;
}

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule || {}).forEach(([date, slots]) => {
    const uniq = Array.from(new Set(slots || []));
    uniq.sort(
      (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
    );
    out[date] = uniq;
  });
  return out;
}

/* ----------------- main component ----------------- */
export default function EditProfilePage({ apiBase }) {
  const { id } = useParams(); // expects route like /doctor-edit/:id
  const navigate = useNavigate();
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api/doctors";

  const [doc, setDoc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [localImageFile, setLocalImageFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repeatAllMap, setRepeatAllMap] = useState({});

  // Real-time Photo Capture States
  const videoRef = useRef(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeStream, setActiveStream] = useState(null);

  const startCamera = async () => {
    // Stop any existing stream tracks first
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }
    setCapturedPhoto(null);
    setCameraError("");
    setIsCameraActive(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" }
      });
      setActiveStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. Please enable permissions.");
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCamera();
    } else {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        setActiveStream(null);
      }
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraModal]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight) || 640;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedPhoto(dataUrl);
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        setIsCameraActive(false);
      }
    }
  };

  const useCapturedPhoto = () => {
    if (!capturedPhoto) return;
    fetch(capturedPhoto)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `doctor_photo_${id}.jpg`, { type: "image/jpeg" });
        if (imagePreview && imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(imagePreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setLocalImageFile(file);
        setDoc((d) => ({ ...d, imageUrl: previewUrl }));
        setShowCameraModal(false);
        addToast("Real-time photo captured successfully", "success");
      })
      .catch((err) => {
        console.error("Error processing captured photo:", err);
        addToast("Failed to process captured image", "error");
      });
  };

  const styles = editProfilePageStyles;

  useEffect(() => {
    let cancelled = false;
    async function fetchDoctor() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to fetch doctor");
        const d = json.data || json || {};
        // Normalize fields (backend may return different keys)
        d.schedule = dedupeAndSortSchedule(d.schedule || {});
        d.imageUrl =
          d.imageUrl || d.image || d.imageUrl === null ? d.imageUrl : d.image;
        if (!cancelled) {
          setDoc(d);
          setImagePreview(d.imageUrl || "");
        }
      } catch (err) {
        console.error("fetchDoctor error:", err);
        addToast("Unable to load profile", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) fetchDoctor();
    return () => {
      cancelled = true;
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addToast = (text, type = "success") => {
    const idt = Date.now() + Math.random();
    const t = { id: idt, text, type };
    setToasts((prev) => [t, ...prev.slice(0, 2)]);
    setTimeout(
      () => setToasts((prev) => prev.filter((it) => it.id !== idt)),
      3000,
    );
  };

  /* ---------- schedule helpers ---------- */
  const addDate = (dateStr) => {
    if (!dateStr) return;
    if (doc.schedule[dateStr]) {
      addToast("Date already exists", "error");
      return;
    }
    setDoc((d) => ({ ...d, schedule: { ...d.schedule, [dateStr]: [] } }));
    addToast("Date added successfully", "success");
  };

  const addRecurringSlot = (time) => {
    if (!time) return;
    const formatted = formatTimeFromInput(time);
    setDoc((d) => {
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      if (recurring.includes(formatted)) {
        addToast(`Daily slot ${formatted} already exists`, "error");
        return d;
      }
      const updated = [...recurring, formatted];
      updated.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
      return { ...d, recurringSlots: updated };
    });
    addToast(`Daily slot ${formatted} added`, "success");
  };

  const removeRecurringSlot = (slot) => {
    setDoc((d) => {
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      const updated = recurring.filter((s) => s !== slot);
      return { ...d, recurringSlots: updated };
    });
    addToast(`Daily slot ${slot} removed globally`, "info");
  };

  const addSlot = (dateStr, time, repeatDaily = false, repeatToAll = false) => {
    if (!dateStr || !time) return;
    const formatted = formatTimeFromInput(time);

    if (repeatDaily) {
      addRecurringSlot(time);
      return;
    }

    setDoc((d) => {
      const updatedSchedule = { ...d.schedule };
      const datesToUpdate = repeatToAll ? Object.keys(updatedSchedule) : [dateStr];
      
      let addedAny = false;
      datesToUpdate.forEach((dt) => {
        const existing = updatedSchedule[dt] || [];
        if (!existing.includes(formatted)) {
          addedAny = true;
          const nextArr = [...existing, formatted];
          nextArr.sort(
            (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
          );
          updatedSchedule[dt] = nextArr;
        }
      });

      if (!addedAny && !repeatToAll) {
        addToast(`${formatted} already exists for ${dateStr}`, "error");
        return d;
      }

      return { ...d, schedule: updatedSchedule };
    });

    if (repeatToAll) {
      addToast(`Time slot ${formatted} added to all dates`, "success");
    } else {
      addToast(`Time slot ${formatted} added`, "success");
    }
  };

  const applyTimesToAllDates = (sourceDate) => {
    const sourceSlots = doc.schedule[sourceDate] || [];
    if (sourceSlots.length === 0) {
      addToast("No time slots to copy", "error");
      return;
    }
    setDoc((d) => {
      const updatedSchedule = { ...d.schedule };
      Object.keys(updatedSchedule).forEach((dateKey) => {
        const nextArr = [...sourceSlots];
        updatedSchedule[dateKey] = nextArr;
      });
      return { ...d, schedule: updatedSchedule };
    });
    addToast(`Applied times from ${sourceDate} to all dates`, "success");
  };

  const removeSlot = (dateStr, slot) => {
    setDoc((d) => {
      // 1. If it exists in date-specific schedule, remove it from there
      const dateSlots = d.schedule[dateStr] || [];
      if (dateSlots.includes(slot)) {
        const next = dateSlots.filter((s) => s !== slot);
        addToast(`Removed ${slot} from ${dateStr}`, "info");
        return { ...d, schedule: { ...d.schedule, [dateStr]: next } };
      }
      
      // 2. If it is a daily slot, block it for this specific date
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      if (recurring.includes(slot)) {
        const blocked = Array.isArray(d.blockedSlots) ? d.blockedSlots : [];
        const alreadyBlocked = blocked.some((b) => b && b.date === dateStr && b.slot === slot);
        if (!alreadyBlocked) {
          addToast(`Blocked daily slot ${slot} for ${dateStr}`, "info");
          return {
            ...d,
            blockedSlots: [...blocked, { date: dateStr, slot }],
          };
        }
      }
      
      return d;
    });
  };

  const restoreBlockedSlot = (dateStr, slot) => {
    setDoc((d) => {
      const blocked = Array.isArray(d.blockedSlots) ? d.blockedSlots : [];
      const updatedBlocked = blocked.filter((b) => !(b && b.date === dateStr && b.slot === slot));
      addToast(`Restored daily slot ${slot} for ${dateStr}`, "success");
      return { ...d, blockedSlots: updatedBlocked };
    });
  };

  const removeDate = (dateStr) => {
    setDoc((d) => {
      const clone = { ...d.schedule };
      delete clone[dateStr];
      return { ...d, schedule: clone };
    });
    addToast(`Date ${dateStr} removed`, "info");
  };

  /* ---------- image handling ---------- */
  const handleImageChange = (e) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:"))
      URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setLocalImageFile(file);
    setDoc((d) => ({ ...d, imageUrl: url }));
    addToast("Profile image updated locally", "success");
  };

  const toggleAvailability = () => {
    setDoc((d) => {
      const current = d.availability === "Available" || d.available === true;
      const nextVal = current ? "Unavailable" : "Available";
      return { ...d, availability: nextVal, available: !current };
    });
    addToast("Availability toggled", "info");
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch");
      const d = json.data || json || {};
      d.schedule = dedupeAndSortSchedule(d.schedule || {});
      setDoc(d);
      setImagePreview(d.imageUrl || "");
      setLocalImageFile(null);
      setEditing(false);
      addToast("Reset to server profile", "info");
    } catch (err) {
      console.error("Reset error:", err);
      addToast("Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- save to backend ---------- */
  const handleSave = async () => {
    if (!doc) return;
    setSaveMessage({ type: "saving", text: "Saving profile..." });
    addToast("Saving profile...", "info");

    try {
      const form = new FormData();

      // append updatable fields
      const updatable = [
        "name",
        "specialization",
        "bmdcNumber",
        "experience",
        "qualifications",
        "location",
        "about",
        "fee",
        "availability",
        "success",
        "patients",
        "rating",
        "email",
        "defaultMaxPatientsPerDay",
        "repeatLimitEnabled",
      ];
      updatable.forEach((k) => {
        if (doc[k] !== undefined && doc[k] !== null) {
          form.append(k, String(doc[k]));
        }
      });

      form.append("schedule", JSON.stringify(doc.schedule || {}));
      form.append("maxPatientsPerDay", JSON.stringify(doc.maxPatientsPerDay || {}));
      form.append("defaultHospital", JSON.stringify(doc.defaultHospital || { name: "", address: "" }));
      form.append("slotHospitals", JSON.stringify(doc.slotHospitals || {}));

      // NEW: Pricing tiers and blackout periods
      if (doc.pricingTiers) {
        form.append("pricingTiers", JSON.stringify(doc.pricingTiers));
      }
      if (doc.blackoutPeriods) {
        form.append("blackoutPeriods", JSON.stringify(doc.blackoutPeriods));
      }
      if (doc.recurringSlots) {
        form.append("recurringSlots", JSON.stringify(doc.recurringSlots));
      }
      if (doc.blockedSlots) {
        form.append("blockedSlots", JSON.stringify(doc.blockedSlots));
      }

      if (localImageFile) {
        form.append("image", localImageFile);
      } else if (doc.imageUrl && !doc.imageUrl.startsWith("blob:")) {
        form.append("imageUrl", doc.imageUrl);
      }

      const token =
        localStorage.getItem("doctorToken_v1") ||
        localStorage.getItem("doctor_token") ||
        localStorage.getItem("doctorToken") ||
        localStorage.getItem("token") ||
        "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers,
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to save");
      }

      const updated = json.data || json;
      updated.schedule = dedupeAndSortSchedule(updated.schedule || {});
      setDoc(updated);
      setLocalImageFile(null);
      setImagePreview(updated.imageUrl || imagePreview);
      setEditing(false);
      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
      addToast("Profile saved successfully!", "success");
      setTimeout(() => setSaveMessage(null), 1500);
    } catch (err) {
      console.error("handleSave error:", err);
      setSaveMessage({ type: "error", text: "Save failed" });
      addToast(err.message || "Save failed", "error");
    }
  };

  /* ---------- UI field configs ---------- */
  const fieldConfigs = doc
    ? [
        {
          icon: User,
          label: "Name",
          value: doc.name || "",
          onChange: (v) => setDoc((d) => ({ ...d, name: v })),
        },
        {
          icon: Briefcase,
          label: "Specialization",
          value: doc.specialization || "",
          onChange: (v) => setDoc((d) => ({ ...d, specialization: v })),
        },
        {
          icon: Clock,
          label: "Experience",
          value: doc.experience || "",
          onChange: (v) => setDoc((d) => ({ ...d, experience: v })),
        },
        {
          icon: GraduationCap,
          label: "Qualifications",
          value: doc.qualifications || "",
          onChange: (v) => setDoc((d) => ({ ...d, qualifications: v })),
        },
        {
          icon: MapPin,
          label: "Location",
          value: doc.location || "",
          onChange: (v) => setDoc((d) => ({ ...d, location: v })),
        },
        // NEW: Patients
        {
          icon: User,
          label: "Patients",
          value: doc.patients ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, patients: v === "" ? "" : Number(v) || 0 })),
        },
        // NEW: Success (percent or count depending on your model)
        {
          icon: CheckCircle,
          label: "Success",
          value: doc.success ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, success: v === "" ? "" : Number(v) || 0 })),
        },
        // NEW: Rating (0.0 - 5.0)
        {
          icon: Star,
          label: "Rating (out of 5)",
          value: doc.rating ?? "",
          onChange: (v) =>
            setDoc((d) => ({
              ...d,
              rating: v === "" ? "" : parseFloat(v) || 0,
            })),
        },
        {
          icon: DollarSign,
          label: "Fee (Tk)",
          value: doc.fee ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, fee: v === "" ? "" : Number(v) || 0 })),
        },
      ]
    : [];

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.errorText}>Doctor not found.</div>
      </div>
    );
  }

  const isAvailable = doc.availability === "Available" || doc.available;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.maxWidthContainer}>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-full font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" /> Back
        </button>
        {/* Toasts */}
        <div className={styles.toastContainer}>
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`${styles.toastBase} ${
                t.type === "error"
                  ? styles.toastError
                  : t.type === "info"
                    ? styles.toastInfo
                    : styles.toastSuccess
              }`}
            >
              {t.type === "error" ? (
                <AlertCircle
                  className={`${styles.toastIcon} ${styles.toastErrorIcon}`}
                />
              ) : (
                <Check
                  className={`${styles.toastIcon} ${styles.toastSuccessIcon}`}
                />
              )}
              <span className={styles.toastText}>{t.text}</span>
            </div>
          ))}
        </div>

        <div className={styles.mainCard}>
          <div className={styles.headerBackground}>
            <div className={styles.imageContainer}>
              <div className={styles.imageWrapper}>
                <img
                  src={imagePreview || ""}
                  alt={doc.name}
                  className={styles.profileImage}
                />
                {editing ? (
                  <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                    <label className="bg-white border border-slate-300 rounded-full p-2 shadow-md cursor-pointer transition-all hover:scale-105 hover:bg-slate-50 flex items-center justify-center" title="Upload Photo">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <ImageIcon className="w-5 h-5 text-blue-900" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="bg-white border border-slate-300 rounded-full p-2 shadow-md cursor-pointer transition-all hover:scale-105 hover:bg-slate-50 flex items-center justify-center"
                      title="Take Real-time Photo"
                    >
                      <Camera className="w-5 h-5 text-blue-900" />
                    </button>
                  </div>
                ) : (
                  <label className={styles.imageEditButton(editing)}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.imageInput}
                      disabled={true}
                    />
                    <ImageIcon className={styles.imageEditIcon(editing)} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className={styles.profileContent}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{doc.name}</h1>
                <p className={styles.profileSubtitle}>
                  <Briefcase className={styles.subtitleIcon} />
                  <span className="truncate">
                    {doc.specialization} : {doc.location}
                  </span>
                </p>

                <div className={styles.statsContainer}>
                  {/* Patients */}
                  <div className={styles.statItem}>
                    <User
                      className={`${styles.statIcon} ${styles.statEmeraldIcon}`}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className={styles.statLabel}>Patients</div>
                        {!editing ? (
                          <div className={styles.statValue}>{doc.patients}</div>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={doc.patients ?? ""}
                            onChange={(e) =>
                              setDoc((d) => ({
                                ...d,
                                patients:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              }))
                            }
                            className={styles.statPatientsInput}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success */}
                  <div className={styles.statItem}>
                    <CheckCircle
                      className={`${styles.statIcon} ${styles.statEmeraldIcon}`}
                    />
                    <div className="flex flex-col">
                      <div className={styles.statLabel}>Success</div>
                      {!editing ? (
                        <div className={styles.statValue}>{doc.success}</div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={doc.success ?? ""}
                          onChange={(e) =>
                            setDoc((d) => ({
                              ...d,
                              success:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            }))
                          }
                          className={styles.statPatientsInput}
                        />
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className={styles.ratingStatItem}>
                    <Star className={styles.statAmberIcon("star")} />
                    <div className="flex flex-col">
                      <div className={styles.statAmberLabel}>Rating</div>
                      {!editing ? (
                        <div className={styles.statAmberValue}>
                          {typeof doc.rating === "number"
                            ? `${doc.rating}/5`
                            : doc.rating}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            step={0.1}
                            value={doc.rating ?? ""}
                            onChange={(e) =>
                              setDoc((d) => ({
                                ...d,
                                rating:
                                  e.target.value === ""
                                    ? ""
                                    : parseFloat(e.target.value),
                              }))
                            }
                            className={styles.statInput}
                          />
                          <div className="text-sm text-amber-700">/5</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee */}
                  <div className={styles.feeStatItem}>
                    <Banknote className={styles.statAmberIcon()} />
                    {!editing ? (
                      <span className={styles.statAmberValue}>{doc.fee}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doc.fee ?? ""}
                        onChange={(e) =>
                          setDoc((d) => ({
                            ...d,
                            fee:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className={styles.statInput}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={toggleAvailability}
                  className={styles.availabilityToggle(isAvailable)}
                >
                  <div className={styles.toggleTrack(isAvailable)}>
                    <div className={styles.toggleThumb(isAvailable)}></div>
                  </div>
                  <span className={styles.toggleText(isAvailable)}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </button>

                <button
                  onClick={() => setEditing((s) => !s)}
                  className={styles.editButton}
                >
                  <div className={styles.editButtonContent}>
                    <Edit2 className="w-4 h-4" />
                    <span className="font-medium">
                      {editing ? "Cancel" : "Edit Profile"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconContainer}>
                  <User className={styles.sectionIcon} />
                </div>
                Personal Information
              </h2>

              <div className={styles.fieldGrid}>
                {fieldConfigs.map((field, index) => (
                  <div key={index} className={styles.fieldGroup}>
                    <div className={styles.fieldHeader}>
                      <div className={styles.fieldIconContainer(editing)}>
                        <field.icon className={styles.fieldIcon} />
                      </div>
                      <label className={styles.fieldLabel}>{field.label}</label>
                    </div>
                    <input
                      value={field.value}
                      onChange={(e) =>
                        editing && field.onChange(e.target.value)
                      }
                      disabled={!editing}
                      readOnly={!editing}
                      className={styles.inputBase(editing)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconContainer}>
                  <Briefcase className={styles.sectionIcon} />
                </div>
                About
              </h2>
              <div className="relative">
                <textarea
                  rows={3}
                  value={doc.about || ""}
                  onChange={(e) =>
                    editing && setDoc((d) => ({ ...d, about: e.target.value }))
                  }
                  disabled={!editing}
                  readOnly={!editing}
                  className={styles.aboutTextarea(editing)}
                  placeholder="Tell patients about your expertise, approach, and philosophy..."
                />
                <div className={styles.aboutCharCount}>
                  {(doc.about || "").length}/500
                </div>
              </div>
            </div>

            {/* Medical Certificate */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconContainer}>
                  <CheckCircle className={styles.sectionIcon} />
                </div>
                Medical Certification License
              </h2>
              <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">Verification Status:</span>
                  {doc.isVerified ? (
                    <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified Practitioner
                    </span>
                  ) : doc.verificationStatus === "Pending" ? (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" /> Verification Pending
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Unverified
                    </span>
                  )}
                </div>

                {doc.certificateUrl && (
                  <div className="text-sm">
                    <a
                      href={doc.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold underline"
                    >
                      📄 View Uploaded Professional License/Certificate
                    </a>
                  </div>
                )}

                {editing && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Upload New Certificate Document (PDF/Image)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        addToast("Uploading certificate...", "info");
                        try {
                          const form = new FormData();
                          form.append("certificate", file);
                          
                          const token = localStorage.getItem(STORAGE_KEY);
                          const headers = token ? { Authorization: `Bearer ${token}` } : {};
                          
                          const res = await fetch(`${API_BASE}/${id}/certificate`, {
                            method: "PUT",
                            headers,
                            body: form,
                          });
                          const json = await res.json();
                          if (json.success) {
                            setDoc(json.data);
                            addToast("Certificate uploaded successfully!", "success");
                          } else {
                            addToast(json.message || "Upload failed", "error");
                          }
                        } catch (err) {
                          addToast("Error uploading certificate", "error");
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Consultation Pricing Tiers */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconContainer}>
                  <Banknote className={styles.sectionIcon} />
                </div>
                Consultation Pricing Tiers
              </h2>
              <p className="text-xs text-slate-400 mb-4">Set different fees per consultation type. Patients will see these when booking.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{type: 'video', emoji: '🎥', label: 'Video Call'}, {type: 'offline', emoji: '🏢', label: 'Offline Visit'}].map(opt => (
                  <div key={opt.type} className="p-4 bg-slate-50 border rounded-2xl flex flex-col gap-2">
                    <div className="text-lg text-center">{opt.emoji}</div>
                    <div className="text-xs font-bold text-slate-600 text-center">{opt.label}</div>
                    <div className="flex items-center border rounded-xl overflow-hidden bg-white">
                      <span className="px-3 text-xs font-bold text-slate-500 bg-slate-50 border-r h-full flex items-center py-2">Tk</span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={doc?.pricingTiers?.[opt.type] ?? ''}
                        onChange={(e) => editing && setDoc(d => ({
                          ...d,
                          pricingTiers: { ...(d.pricingTiers || {}), [opt.type]: e.target.value === '' ? '' : Number(e.target.value) }
                        }))}
                        disabled={!editing}
                        placeholder="0"
                        className="flex-1 px-3 py-2 text-sm font-bold text-emerald-700 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vacation & Blackout Calendar */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconContainer}>
                  <Calendar className={styles.sectionIcon} />
                </div>
                Vacation & Blackout Periods
              </h2>
              <p className="text-xs text-slate-400 mb-4">Block out dates when you are unavailable. Patients with affected appointments will be notified to reschedule.</p>

              {/* Add blackout period */}
              {editing && (
                <div className="flex flex-wrap gap-3 mb-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Start Date</label>
                    <input
                      id="blackout-start"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">End Date</label>
                    <input
                      id="blackout-end"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Reason (optional)</label>
                    <input
                      id="blackout-reason"
                      type="text"
                      placeholder="e.g. Medical conference"
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-400 w-48"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const start = document.getElementById('blackout-start')?.value;
                      const end = document.getElementById('blackout-end')?.value;
                      const reason = document.getElementById('blackout-reason')?.value || '';
                      if (!start || !end) { addToast('Please select both start and end dates', 'error'); return; }
                      if (start > end) { addToast('End date must be after start date', 'error'); return; }
                      setDoc(d => ({
                        ...d,
                        blackoutPeriods: [...(d.blackoutPeriods || []), { startDate: start, endDate: end, reason }]
                      }));
                      document.getElementById('blackout-start').value = '';
                      document.getElementById('blackout-end').value = '';
                      document.getElementById('blackout-reason').value = '';
                      addToast(`Blackout period added: ${start} to ${end}`, 'success');
                    }}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Block Dates
                  </button>
                </div>
              )}

              {/* Display blackout periods */}
              {(doc?.blackoutPeriods || []).length === 0 ? (
                <div className="text-center py-6 text-slate-300 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  No blackout periods set
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(doc.blackoutPeriods || []).map((bp, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-2xl text-xs">
                      <span className="text-red-500">🚧</span>
                      <div>
                        <span className="font-bold text-red-800">{bp.startDate}</span>
                        {bp.endDate !== bp.startDate && <span className="text-red-500"> → {bp.endDate}</span>}
                        {bp.reason && <span className="text-red-400 ml-1">({bp.reason})</span>}
                      </div>
                      {editing && (
                        <button
                          type="button"
                          onClick={() => setDoc(d => ({
                            ...d,
                            blackoutPeriods: (d.blackoutPeriods || []).filter((_, i) => i !== idx)
                          }))}
                          className="ml-1 text-red-400 hover:text-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actionsSection}>
              <div className={styles.actionsText}>
                {editing
                  ? "Make changes and save your profile"
                  : "View and edit your profile"}
              </div>

              <div className={styles.actionsButtons}>
                <button onClick={handleReset} className={styles.resetButton}>
                  Reset to Server
                </button>

                <button
                  onClick={handleSave}
                  disabled={!editing || saveMessage?.type === "saving"}
                  className={styles.saveButton}
                >
                  {saveMessage?.type === "saving" ? (
                    <div className={styles.saveButtonContent}>
                      <div className={styles.saveSpinner}></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className={styles.saveButtonContent}>
                        <Save className="w-4 h-4" />
                        <span className="font-medium">Save Profile</span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Photo Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col scale-in duration-300">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-800" />
                Take Profile Photo
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCameraModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Camera Stream / Preview */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 relative">
              {cameraError ? (
                <div className="flex flex-col items-center text-center p-6 text-red-600">
                  <AlertCircle className="w-12 h-12 mb-2 text-red-500" />
                  <p className="font-semibold text-sm">{cameraError}</p>
                  <button 
                    type="button" 
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-full text-xs font-bold hover:bg-blue-900 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : capturedPhoto ? (
                /* Photo Preview */
                <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-black">
                  <img 
                    src={capturedPhoto} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-800/10 pointer-events-none" />
                </div>
              ) : (
                /* Active Camera Feed */
                <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-black flex items-center justify-center">
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-800" />
                      <span className="text-xs font-semibold">Initializing camera...</span>
                    </div>
                  )}
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${!isCameraActive ? "hidden" : ""}`}
                  />
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3 bg-white dark:bg-slate-900">
              {capturedPhoto ? (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-xs font-bold text-center"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={useCapturedPhoto}
                    className="flex-1 px-4 py-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition text-xs font-bold text-center shadow-sm"
                  >
                    Use Photo
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(false)}
                    className="px-4 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-xs font-bold min-w-[100px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isCameraActive}
                    className={`px-6 py-2.5 rounded-full bg-blue-800 text-white hover:bg-blue-900 transition text-xs font-bold flex items-center gap-2 shadow-sm ${!isCameraActive ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
      <style>{styles.customCSS}</style>
    </div>
  );
}

/* ---------- Helper components ---------- */
function AddDate({ onAdd }) {
  const styles = editProfilePageStyles;
  const [value, setValue] = useState("");
  const handleAdd = () => {
    if (value) {
      onAdd(value);
      setValue("");
    }
  };
  return (
    <div className={styles.addDateContainer}>
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        className={styles.addDateInput}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button onClick={handleAdd} className={styles.addDateButton}>
        <Plus className={styles.addDateIcon} />
        <span className="font-medium">Add Date</span>
      </button>
    </div>
  );
}
