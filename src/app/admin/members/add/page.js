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
  const [saving, setSaving] = useState(false);

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
            {/* ── Page Header ── */}
            <header className="mb-8 border-l-4 border-[#C9A84C] pl-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9D7B32]">
                New Registration
              </p>
              <h2
                className="mt-1 text-[30px] font-semibold leading-tight text-[#1A1A2E]"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                Add New Member
              </h2>
              <p className="mt-1.5 text-sm font-medium text-[#9D7B32]">
                Create a member profile and generate their QR token
              </p>
            </header>

            <div className="space-y-6">
              {/* ── Photo + Names ── */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Photo Upload */}
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                  <label className="label-2026">Profile Photo</label>
                  <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#C9A84C]/50 bg-[#FDFCF8] transition hover:border-[#C9A84C] hover:bg-white sm:w-40">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#C9A84C]">
                        <svg
                          className="h-9 w-9 opacity-60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <span className="text-center text-[10px] font-bold uppercase tracking-widest">
                          Upload Photo
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar(null);
                        setAvatarPreview(null);
                      }}
                      className="mt-1 text-center text-[11px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Names */}
                <div className="mt-1 w-full flex-1 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-2026">First Name</label>
                      <input
                        className="input-2026"
                        placeholder="Jane"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="label-2026">Last Name</label>
                      <input
                        className="input-2026"
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-2026">Middle Name</label>
                    <input
                      className="input-2026"
                      placeholder="Elizabeth"
                      value={form.middle_name}
                      onChange={(e) =>
                        setForm({ ...form, middle_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ── Demographics ── */}
              <div className="grid gap-5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <CustomCalendar
                    label="Birthday"
                    value={form.date_of_birth}
                    onChange={(val) => setForm({ ...form, date_of_birth: val })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label-2026">Age</label>
                  <input
                    type="number"
                    className="input-2026"
                    placeholder="0"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-4">
                  <CustomSelect
                    label="Sex"
                    value={form.sex}
                    options={["Male", "Female"]}
                    onChange={(val) => setForm({ ...form, sex: val })}
                  />
                </div>
              </div>

              {/* ── Contact & Address ── */}
              <div className="grid gap-5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="label-2026">Contact Number</label>
                  <input
                    className="input-2026"
                    placeholder="+63 9xx xxxx xxx"
                    value={form.contact_number}
                    onChange={(e) =>
                      setForm({ ...form, contact_number: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className="label-2026">Home Address</label>
                  <input
                    className="input-2026"
                    placeholder="Complete address..."
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* ── Submit ── */}
              <div className="pt-2">
                <button
                  disabled={saving}
                  className="btn-primary w-full py-4 text-lg shadow-lg"
                >
                  {saving ? "Saving…" : "Save Member Profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
