"use client"

import { supabase } from "@/lib/supabase"
import { FiBookmark, FiSearch, FiFileText, FiStar, FiZap } from "react-icons/fi"
import { FaGoogle } from "react-icons/fa"
import Image from "../assets/login.jpg";

export default function LoginPage() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="w-full h-full flex">
        {/* Left Side Image */}
        <div className="hidden lg:flex w-1/2 items-center justify-center p-8">
          <img
            src={Image.src}
            alt="Login Illustration"
            className="w-full h-auto object-cover rounded-2xl shadow-lg"
          />  
        </div>

        {/* Center Login Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <FiBookmark size={60} className="mx-auto text-blue-600 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                <p className="text-gray-600">Sign in to manage your bookmarks</p>
              </div>

              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105"
              >
                <FaGoogle size={20} />
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Secure & Easy</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-600">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Decorative */}
        {/* <div className="hidden lg:flex w-1/2 items-center justify-center p-8 bg-gradient-to-br from-blue-100 to-purple-100">
          <div className="space-y-20 text-center">
            <FiStar size={80} className="animate-bounce text-blue-600 mx-auto" />
            <FiBookmark size={60} className="text-purple-600 mx-auto" />
            <FiZap size={80} className="animate-bounce text-blue-600 mx-auto" style={{ animationDelay: "0.5s" }} />
            <FiSearch size={60} className="text-purple-600 mx-auto" />
          </div>
        </div> */}
      </div>
    </div>
  )
}
