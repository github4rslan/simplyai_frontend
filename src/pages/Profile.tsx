import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProfile } from "@/components/dashboard/UserProfile";

const Profile = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-gradient-to-b from-white to-purple-50 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <UserProfile />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
