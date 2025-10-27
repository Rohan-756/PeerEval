"use client";
import { useRouter } from "next/navigation";
import { HomeIcon } from "lucide-react";
import Header from "./components/Header";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
    <Header user={{id:'', email:'', role:'student'}} onLogout={()=>{}}/>
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50 p-8">
      <div className="text-center w-full max-w-2xl bg-white p-12 rounded-2xl shadow-2xl border border-indigo-100">
        <HomeIcon className="w-16 h-16 mx-auto text-indigo-500 mb-6" />
        <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
          Welcome to PeerEval System
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Evaluate peers. Manage projects. Simplify collaboration.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="bg-indigo-600 text-white px-8 py-3 text-lg font-bold rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg"
        >
          Create Account or Log In
        </button>
      </div>
    </div>
    </>
  );
}
