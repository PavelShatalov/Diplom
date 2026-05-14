import React, { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
	// Храним токен в localStorage
	const [token, setToken] = useState(localStorage.getItem("token") || "");

	// Регистрация
	const registerUser = async (email, password) => {
		await axios.post(`${API_BASE_URL}/api/auth/register`, {
			email,
			password,
		});
	};

	// Логин
	const loginUser = async (email, password) => {
		const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
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
		baseURL: `${API_BASE_URL}/api`,
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
