"use client";

import { useState } from "react";
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

export default function AddMemberPage() {
  const [form, setForm] = useState(initialForm);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatar(null);
      setAvatarPreview(null);
    }
  };
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.set(key, value));
      if (avatar) formData.set("avatar", avatar);

      await apiFetch("/api/members", {
        method: "POST",
        body: formData,
      });

      setForm(initialForm);
      setAvatar(null);
      setAvatarPreview(null);
      
      Swal.fire({
        icon: "success",
        title: "Member Created",
        text: "The new member record and QR token have been generated.",
        confirmButtonText: "Great",
        timer: 3000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell title="Add Member">
        <div className="w-full space-y-5 lg:space-y-6">
          <form onSubmit={handleSubmit} className="surface p-7 lg:p-8">
            <header className="mb-6">
              <h3 className="text-2xl font-black text-[#1a1610] tracking-tight">Create new profile</h3>
              <p className="mt-1 text-sm text-[#6f644f]">Enter the details needed for the profile, QR token, and card.</p>
            </header>

            <div className="space-y-6">
              {/* Top Section: Photo and Names */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Square Photo Upload */}
                <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                  <label className="label-2026">Profile Photo</label>
                  <div className="relative group h-40 w-full sm:w-40 overflow-hidden rounded-3xl border-2 border-dashed border-[#dfd4bf] bg-[#fdfaf5] transition hover:border-[#9d7b32] hover:bg-white flex items-center justify-center shadow-sm">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
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
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                {/* Names */}
                <div className="flex-1 w-full space-y-5 mt-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-2026">First Name</label>
                      <input className="input-2026" placeholder="Jane" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label-2026">Last Name</label>
                      <input className="input-2026" placeholder="Doe" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="label-2026">Middle Name</label>
                    <input className="input-2026" placeholder="Elizabeth" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} required />
                  </div>
                </div>
              </div>

              {/* Second Row: Demographics */}
              <div className="grid gap-5 sm:grid-cols-12 mt-2">
                <div className="sm:col-span-5">
                  <CustomCalendar label="Birthday" value={form.date_of_birth} onChange={(val) => setForm({ ...form, date_of_birth: val })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="label-2026">Age</label>
                  <input type="number" className="input-2026" placeholder="0" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
                </div>
                <div className="sm:col-span-4">
                  <CustomSelect label="Sex" value={form.sex} options={["Male", "Female"]} onChange={(val) => setForm({ ...form, sex: val })} />
                </div>
              </div>

              {/* Third Row: Contact & Address */}
              <div className="grid gap-5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="label-2026">Contact Number</label>
                  <input className="input-2026" placeholder="+63 9xx xxxx xxx" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
                </div>
                <div className="sm:col-span-7">
                  <label className="label-2026">Home Address</label>
                  <input className="input-2026" placeholder="Complete address..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
              </div>

              <div className="pt-4">
                <button disabled={saving} className="btn-primary w-full py-5 text-lg shadow-lg">
                  {saving ? "Saving..." : "Save member profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
