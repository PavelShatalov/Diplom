import React, { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	// Храним токен в localStorage
	const [token, setToken] = useState(localStorage.getItem("token") || "");

	// Регистрация
	const registerUser = async (email, password) => {
		await axios.post("http://localhost:5000/api/auth/register", {
			email,
			password,
		});
	};

	// Логин
	const loginUser = async (email, password) => {
		const res = await axios.post("http://localhost:5000/api/auth/login", {
			email,
			password,
		});
		const newToken = res.data.token;
		setToken(newToken);
		localStorage.setItem("token", newToken);
	};

	// Логаут
	const logoutUser = () => {
		setToken("");
		localStorage.removeItem("token");
	};

	// Axios экземпляр с подстановкой токена
	const authAxios = axios.create({
		baseURL: "http://localhost:5000/api",
	});

	authAxios.interceptors.request.use((config) => {
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	return (
		<AuthContext.Provider
			value={{
				token,
				registerUser,
				loginUser,
				logoutUser,
				authAxios,
			}}>
			{children}
		</AuthContext.Provider>
	);
};
