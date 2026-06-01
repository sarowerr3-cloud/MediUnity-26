import React, { useEffect, useState } from "react";
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
      ];
      updatable.forEach((k) => {
        if (doc[k] !== undefined && doc[k] !== null) {
          form.append(k, String(doc[k]));
        }
      });

      form.append("schedule", JSON.stringify(doc.schedule || {}));

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

      const token = localStorage.getItem(STORAGE_KEY);
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
                <label className={styles.imageEditButton(editing)}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.imageInput}
                    disabled={!editing}
                  />
                  <ImageIcon className={styles.imageEditIcon(editing)} />
                </label>
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

            {/* Schedule */}
            <div className={styles.formSection}>
              <div className={styles.scheduleHeader}>
                <h2 className={styles.sectionTitle}>
                  <div className={styles.sectionIconContainer}>
                    <Calendar className={styles.sectionIcon} />
                  </div>
                  Schedule & Availability
                </h2>

                <div className="flex items-center gap-3">
                  {editing && <AddDate onAdd={addDate} />}
                  {saveMessage && (
                    <div className={styles.saveMessage(saveMessage.type)}>
                      {saveMessage.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Recurring Slots Card */}
              {editing && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                        <Clock className="w-4 h-4 text-emerald-600" /> Daily Recurring Time Slots
                      </h3>
                      <p className="text-[11px] text-slate-400">These slots repeat every day and apply to all scheduled dates.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(!doc.recurringSlots || doc.recurringSlots.length === 0) ? (
                      <span className="text-xs text-slate-400 italic">No daily recurring slots defined yet.</span>
                    ) : (
                      doc.recurringSlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full">
                          <span>{slot}</span>
                          <button
                            type="button"
                            onClick={() => removeRecurringSlot(slot)}
                            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="time"
                      id="recurring-slot-input"
                      className={styles.addSlotInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value) {
                          addRecurringSlot(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("recurring-slot-input");
                        if (input && input.value) {
                          addRecurringSlot(input.value);
                          input.value = "";
                        }
                      }}
                      className={styles.addSlotButton}
                    >
                      <Plus className={styles.addSlotIcon} />
                    </button>
                  </div>
                </div>
              )}

              {!editing && doc.recurringSlots && doc.recurringSlots.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                      <Clock className="w-4 h-4 text-emerald-600" /> Daily Recurring Time Slots
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doc.recurringSlots.map((slot, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(doc.schedule || {}).length === 0 ? (
                <div className={styles.emptySchedule}>
                  <Calendar className={styles.emptyScheduleIcon} />
                  <p className={styles.emptyScheduleText}>
                    No schedule added yet
                  </p>
                  <p className={styles.emptyScheduleSubtext}>
                    Add dates to create time slots
                  </p>
                </div>
              ) : (
                <div className={styles.scheduleGrid}>
                  {Object.entries(doc.schedule)
                    .sort(([a], [b]) => (a > b ? 1 : -1))
                    .map(([date, slots]) => {
                      const dateSpecificSlots = slots || [];
                      const recurringSlots = Array.isArray(doc.recurringSlots) ? doc.recurringSlots : [];
                      const blockedSlots = Array.isArray(doc.blockedSlots) ? doc.blockedSlots : [];
                      
                      // Combine and sort
                      const allSlotsCombined = Array.from(new Set([...dateSpecificSlots, ...recurringSlots]));
                      allSlotsCombined.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));

                      return (
                        <div key={date} className={styles.dateCard}>
                          <div className={styles.dateHeader}>
                            <div className="flex items-center gap-3">
                              <div className={styles.dateIconContainer}>
                                <Calendar className={styles.dateIcon} />
                              </div>
                              <div>
                                <div className={styles.dateTitle}>
                                  {new Date(date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className={styles.dateSubtitle}>{date}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={styles.dateSlotCount}>
                                {allSlotsCombined.length} slot{allSlotsCombined.length !== 1 ? "s" : ""}
                              </span>
                              {editing && dateSpecificSlots.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => applyTimesToAllDates(date)}
                                  title="Apply this day's date-specific times to all scheduled dates"
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => editing && removeDate(date)}
                                disabled={!editing}
                                className={styles.dateDeleteButton(editing)}
                              >
                                <Trash className={styles.dateDeleteIcon} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.timeSlotContainer}>
                            {allSlotsCombined.map((slot, idx) => {
                              const isRecurring = recurringSlots.includes(slot);
                              const isBlocked = blockedSlots.some((b) => b && b.date === date && b.slot === slot);
                              
                              return (
                                <div
                                  key={idx}
                                  className={`${styles.timeSlotItem} ${
                                    isBlocked
                                      ? "bg-slate-100/70 border-slate-200 opacity-60 line-through text-slate-400"
                                      : isRecurring
                                        ? "bg-emerald-50/40 border-emerald-200/60"
                                        : "bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className={`${styles.timeSlotIcon} ${isBlocked ? "text-slate-300" : isRecurring ? "text-emerald-500" : ""}`} />
                                    <span className={`${styles.timeSlotText} ${isBlocked ? "text-slate-400 font-normal" : ""}`}>
                                      {slot}
                                    </span>
                                    {isRecurring && !isBlocked && (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[9px] font-bold rounded-full uppercase leading-none font-sans">
                                        Daily
                                      </span>
                                    )}
                                    {isBlocked && (
                                      <span className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-600 text-[9px] font-bold rounded-full uppercase leading-none font-sans">
                                        Blocked
                                      </span>
                                    )}
                                  </div>
                                  {isBlocked ? (
                                    editing && (
                                      <button
                                        type="button"
                                        onClick={() => restoreBlockedSlot(date, slot)}
                                        title="Unblock this slot"
                                        className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => editing && removeSlot(date, slot)}
                                      disabled={!editing}
                                      className={styles.timeSlotDeleteButton(editing)}
                                      title={isRecurring ? "Block for this date only" : "Remove slot"}
                                    >
                                      <X className={styles.timeSlotDeleteIcon} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {editing && (
                              <div className={styles.addSlotContainer}>
                                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      id={`time-input-${date}`}
                                      className={styles.addSlotInput}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && e.target.value) {
                                          const repeat = !!repeatAllMap[date];
                                          const isDaily = !!document.getElementById(`repeat-daily-input-${date}`)?.checked;
                                          addSlot(date, e.target.value, isDaily, repeat);
                                          e.target.value = "";
                                          if (document.getElementById(`repeat-daily-input-${date}`)) {
                                            document.getElementById(`repeat-daily-input-${date}`).checked = false;
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const input = document.getElementById(`time-input-${date}`);
                                        if (input && input.value) {
                                          const repeat = !!repeatAllMap[date];
                                          const isDaily = !!document.getElementById(`repeat-daily-input-${date}`)?.checked;
                                          addSlot(date, input.value, isDaily, repeat);
                                          input.value = "";
                                          if (document.getElementById(`repeat-daily-input-${date}`)) {
                                            document.getElementById(`repeat-daily-input-${date}`).checked = false;
                                          }
                                        }
                                      }}
                                      className={styles.addSlotButton}
                                    >
                                      <Plus className={styles.addSlotIcon} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 font-sans cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        id={`repeat-daily-input-${date}`}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 h-3.5 w-3.5"
                                      />
                                      Repeat daily (every day)
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 font-sans cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={!!repeatAllMap[date]}
                                        onChange={(e) => setRepeatAllMap(prev => ({ ...prev, [date]: e.target.checked }))}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 h-3.5 w-3.5"
                                      />
                                      Repeat to all dates
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
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
