import React, { useContext, useState } from "react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
	const { registerUser } = useContext(AuthContext);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await registerUser(email, password);
			alert("Registered successfully! Please login now.");
			navigate("/login");
		} catch (err) {
			alert("Register error");
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="bg-white p-6 rounded shadow-md w-80">
				<h2 className="text-2xl font-bold mb-4">Register</h2>
				<label className="block mb-2 text-sm font-semibold">Email</label>
				<input
					type="email"
					className="border p-2 rounded w-full mb-4"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<label className="block mb-2 text-sm font-semibold">Password</label>
				<input
					type="password"
					className="border p-2 rounded w-full mb-4"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
					Register
				</button>
			</form>
		</div>
	);
};

export default RegisterPage;
