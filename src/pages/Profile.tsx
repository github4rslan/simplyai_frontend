import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProfile } from "@/components/dashboard/UserProfile";

const Profile = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-cyan-50 via-white to-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <UserProfile />
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
