import React, { useState, useEffect } from "react";
import { Users, Plus, UserCheck, Trash2, Edit3, Heart, Calendar, Shield, Loader2, Check } from "lucide-react";

/**
 * FamilyMemberSelector Component
 * Multi-patient profile switcher for appointment booking and health record management.
 */
const FamilyMemberSelector = ({
  selectedMemberId = null,
  onSelectMember, // (memberId, memberName, relation) => void
  userProfile = null,
}) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    relation: "spouse",
    dateOfBirth: "",
    gender: "Male",
    bloodGroup: "O+",
    phone: "",
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Fetch family members
  const fetchFamilyMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
      }
    } catch (err) {
      console.error("Failed to fetch family members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  // Handle Add Family Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Name is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        setShowAddModal(false);
        setFormData({
          name: "",
          relation: "spouse",
          dateOfBirth: "",
          gender: "Male",
          bloodGroup: "O+",
          phone: "",
        });
        // Auto-select newly added member
        const newMember = data.familyMembers?.[data.familyMembers.length - 1];
        if (newMember && onSelectMember) {
          onSelectMember(newMember._id, newMember.name, newMember.relation);
        }
      } else {
        setFormError(data.message || "Failed to add family member");
      }
    } catch (err) {
      console.error("Add family member error:", err);
      setFormError("Server error adding family member");
    } font-medium {
      setSubmitting(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this family member?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        if (selectedMemberId === memberId && onSelectMember) {
          onSelectMember(null, "Self", "Self");
        }
      }
    } catch (err) {
      console.error("Delete family member error:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">Booking For (Patient Selector)</h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Family Member
        </button>
      </div>

      {/* Member Cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading family profiles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Self Option */}
          <div
            onClick={() => onSelectMember && onSelectMember(null, userProfile?.name || "Self", "Self")}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              !selectedMemberId
                ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                👤
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{userProfile?.name || "Myself"}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Self</div>
              </div>
            </div>
            {!selectedMemberId && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
          </div>

          {/* Family Member Cards */}
          {familyMembers.map((member) => {
            const isSelected = selectedMemberId === member._id;
            return (
              <div
                key={member._id}
                onClick={() => onSelectMember && onSelectMember(member._id, member.name, member.relation)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between relative group ${
                  isSelected
                    ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 capitalize">
                    {member.relation === "spouse" ? "💍" : member.relation === "child" ? "👶" : member.relation === "parent" ? "👵" : "👤"}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{member.relation}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMember(member._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                    title="Delete member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Add Family Member Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahima Begum"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Relationship *</label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 capitalize"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberSelector;
