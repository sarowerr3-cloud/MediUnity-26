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

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

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
        setShowAddModal(false);
        setFormData({
          name: "",
          relation: "spouse",
          dateOfBirth: "",
          gender: "Male",
          bloodGroup: "O+",
          phone: "",
        });
        await fetchFamilyMembers();
        // Auto select newly created member
        if (onSelectMember && data.familyMember) {
          onSelectMember(data.familyMember._id, data.familyMember.name, data.familyMember.relation);
        }
      } else {
        setFormError(data.message || "Failed to add family member");
      }
    } catch (err) {
      console.error("Add family member error:", err);
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const relationLabels = {
    spouse: "Spouse (husband/wife)",
    child: "Child (son/daughter)",
    parent: "Parent (father/mother)",
    sibling: "Sibling (brother/sister)",
    grandparent: "Grandparent",
    other: "Other Relative",
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-sm">Who is this appointment for?</h3>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Main Account Holder Option */}
          <div
            onClick={() => onSelectMember && onSelectMember(null, userProfile?.name || "Myself", "self")}
            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedMemberId === null
                ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{userProfile?.name || "Myself"}</div>
                <div className="text-[11px] font-medium text-emerald-700">Account Holder</div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedMemberId === null ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
              }`}
            >
              {selectedMemberId === null && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Family Members List */}
          {familyMembers.map((member) => {
            const isSelected = selectedMemberId === member._id;
            return (
              <div
                key={member._id}
                onClick={() => onSelectMember && onSelectMember(member._id, member.name, member.relation)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {member.relation} {member.bloodGroup ? `• ${member.bloodGroup}` : ""}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Add Family Member</h3>
            <p className="text-xs text-slate-500 mb-4">Add a family member to manage their appointments and medical records.</p>

            {formError && (
              <div className="p-3 mb-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Rahman"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Relation *</label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Member"}
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
