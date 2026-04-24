"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomCalendar } from "@/components/ui/custom-calendar";

const initialForm = {
  last_name: "",
  first_name: "",
  middle_name: "",
  address: "",
  date_of_birth: "",
  sex: "Male",
  age: "",
  contact_number: "",
};

function fullName(member) {
  return `${member.last_name}, ${member.first_name} ${member.middle_name}`;
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editAvatar, setEditAvatar] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const handleEditAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAvatar(file);
      setEditAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatar(false);
    } else {
      setEditAvatar(null);
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars";
      setEditAvatarPreview(editingMember?.avatar_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${editingMember.avatar_path}` : null);
      setRemoveAvatar(false);
    }
  };

  const handleRemovePhoto = () => {
    setEditAvatar(null);
    setEditAvatarPreview(null);
    setRemoveAvatar(true);
  };

  async function loadMembers() {
    const data = await apiFetch("/api/members");
    setMembers(data.members || []);
  }

  useEffect(() => {
    loadMembers().catch(() => null);
  }, []);

  const activeMembers = members.filter((member) => member.is_active !== false);

  async function handleDelete(member) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to archive ${fullName(member)}? They will no longer appear in attendance scans.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, archive",
      cancelButtonText: "Keep them",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await apiFetch(`/api/members?id=${member.id}`, { method: "DELETE" });
        Swal.fire("Archived!", "The member has been safely removed.", "success");
        await loadMembers();
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    }
  }

  function openEditModal(member) {
    setEditingMember(member);
    setEditForm({
      last_name: member.last_name,
      first_name: member.first_name,
      middle_name: member.middle_name,
      address: member.address,
      date_of_birth: member.date_of_birth,
      sex: member.sex,
      age: member.age,
      contact_number: member.contact_number || "",
    });
    setEditAvatar(null);
    setRemoveAvatar(false);
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars";
    setEditAvatarPreview(
      member.avatar_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${member.avatar_path}`
        : null
    );
    setIsEditModalOpen(true);
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("id", editingMember.id);
      Object.entries(editForm).forEach(([key, value]) => formData.set(key, value));
      if (editAvatar) {
        formData.set("avatar", editAvatar);
      } else if (!removeAvatar && editingMember.avatar_path) {
        formData.set("avatar_path", editingMember.avatar_path);
      }

      await apiFetch("/api/members", {
        method: "PATCH",
        body: formData,
      });

      setIsEditModalOpen(false);
      Swal.fire("Updated!", "Member profile has been successfully updated.", "success");
      await loadMembers();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell title="Members">
        <div className="w-full space-y-5 lg:space-y-6">
          <section className="surface px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9a7838]">Member Records</p>
                <h2 className="mt-1 text-3xl font-semibold text-[#4f4028]">Member directory</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6f644f]">
                  Browse profiles, update details, or archive records.
                </p>
              </div>

              <div className="rounded-full bg-[#f6efdf] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6c33]">
                {activeMembers.length} active members
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="surface overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#f7f1e5] text-left text-[#483d2c]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Details</th>
                        <th className="px-4 py-3 font-semibold">Address</th>
                        <th className="px-4 py-3 font-semibold">Contact</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeMembers.map((member) => {
                        const bucket = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars";
                        const avatarUrl = member.avatar_path
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${member.avatar_path}`
                          : null;

                        return (
                          <tr key={member.id} className="border-t border-[#efe4d1] text-[#5b513f]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-[#e1d4bf] bg-[#f2ead7]">
                                  {avatarUrl ? (
                                    <Image src={avatarUrl} alt={fullName(member)} fill className="object-cover" unoptimized />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-black text-[#9d7b32]">
                                      {member.last_name?.[0] || "?"}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#2f271c]">{fullName(member)}</p>
                                  <p className="text-xs uppercase tracking-[0.14em] text-[#8f7440]">ID {member.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{member.sex} • {member.age} yrs</p>
                              <p className="text-xs text-[#7c715d]">Birthday: {member.date_of_birth}</p>
                            </td>
                            <td className="max-w-[300px] px-4 py-3 text-xs leading-relaxed text-[#6f6552]">{member.address}</td>
                            <td className="px-4 py-3 text-xs font-medium text-[#6f6552]">{member.contact_number || "Not set"}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(member)}
                                  className="rounded-lg border border-[#dfd4bf] bg-[#fdfaf5] px-3 py-1.5 text-xs font-semibold text-[#7d6333] transition hover:bg-[#f5ecd9]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(member)}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                  Archive
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

        </div>

        {/* MODERN EDIT MODAL */}
        {isEditModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content !max-w-3xl">
              <header className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-[#1a1610] tracking-tight">Edit Member Profile</h2>
                  <p className="text-sm font-bold text-[#9d7b32] uppercase tracking-widest">Update credentials & identity</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full p-2 hover:bg-[#f2ead7] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </header>

              <form onSubmit={handleUpdate} className="space-y-6">
                {/* Top Section: Photo and Names */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Square Photo Upload */}
                  <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                    <label className="label-2026">Profile Photo</label>
                    <div className="relative group h-40 w-full sm:w-40 overflow-hidden rounded-3xl border-2 border-dashed border-[#dfd4bf] bg-[#fdfaf5] transition hover:border-[#9d7b32] hover:bg-white flex items-center justify-center shadow-sm">
                      {editAvatarPreview ? (
                        <img src={editAvatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#9d8351] gap-2">
                          <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-center">Upload<br/>Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleEditAvatarChange}
                      />
                    </div>
                    {editAvatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 uppercase tracking-widest text-center mt-1"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Names */}
                  <div className="flex-1 w-full space-y-5 mt-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label-2026">First Name</label>
                        <input className="input-2026" placeholder="Jane" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} required />
                      </div>
                      <div>
                        <label className="label-2026">Last Name</label>
                        <input className="input-2026" placeholder="Doe" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <label className="label-2026">Middle Name</label>
                      <input className="input-2026" placeholder="Elizabeth" value={editForm.middle_name} onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })} required />
                    </div>
                  </div>
                </div>

                {/* Second Row: Demographics */}
                <div className="grid gap-5 sm:grid-cols-12 mt-2">
                  <div className="sm:col-span-5">
                    <CustomCalendar label="Birthday" value={editForm.date_of_birth} onChange={(val) => setEditForm({ ...editForm, date_of_birth: val })} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label-2026">Age</label>
                    <input type="number" className="input-2026" placeholder="0" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} required />
                  </div>
                  <div className="sm:col-span-4">
                    <CustomSelect label="Sex" value={editForm.sex} options={["Male", "Female"]} onChange={(val) => setEditForm({ ...editForm, sex: val })} />
                  </div>
                </div>

                {/* Third Row: Contact & Address */}
                <div className="grid gap-5 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="label-2026">Contact Number</label>
                    <input className="input-2026" placeholder="+63 9xx xxxx xxx" value={editForm.contact_number} onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })} />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="label-2026">Home Address</label>
                    <input className="input-2026" placeholder="Complete address..." value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-ghost flex-1 py-4 font-bold">Discard Changes</button>
                  <button disabled={saving} className="btn-primary flex-[2] py-4 shadow-lg">{saving ? "Updating..." : "Save Profile Updates"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
