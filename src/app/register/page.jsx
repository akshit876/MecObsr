"use client";
import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Select } from "@/components/ui/select";

const Register = () => {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [pass, setPassword] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [role, setRole] = React.useState("operator"); // default role
  const [error, setError] = React.useState("");

  const baseURL = process.env.NEXT_PUBLIC_HOSTNAME + "register";

  const validateForm = () => {
    if (pass !== confirmPass) {
      setError("Passwords do not match");
      return false;
    }
    if (!username || !pass || !confirmPass || !role) {
      setError("All fields are required");
      return false;
    }
    setError("");
    return true;
  };

  const submitHandler = async (data) => {
    if (!validateForm()) return;

    const requestBody = {
      email: username,
      password: pass,
      role: role,
    };

    try {
      const response = await axios.post(baseURL, requestBody);
      console.log(response);
      alert("Account created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Something went wrong...");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitHandler({
              email: username,
              password: pass,
              role: role,
            });
          }}
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={pass}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-600"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-600"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
