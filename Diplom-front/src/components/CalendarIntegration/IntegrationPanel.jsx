import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../AuthContext";

export const IntegrationPanel = () => {
	const { authAxios } = useContext(AuthContext);
	const [status, setStatus] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [activeProvider, setActiveProvider] = useState("");
	const [message, setMessage] = useState("");

	const loadStatus = useCallback(async () => {
		try {
			const res = await authAxios.get("/integration/status");
			setStatus(res.data);
		} catch (err) {
			console.error("Integration status error:", err);
		}
	}, [authAxios]);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const handleConnect = async (provider) => {
		setIsLoading(true);
		setActiveProvider(provider);
		setMessage("");
		try {
			const res = await authAxios.get(`/integration/${provider}/auth-url`);
			window.location.href = res.data.url;
		} catch (err) {
			setMessage(
				err.response?.data?.message || `Cannot connect ${provider} calendar.`
			);
			setIsLoading(false);
			setActiveProvider("");
		}
	};

	const handleSync = async (provider) => {
		setIsLoading(true);
		setActiveProvider(provider);
		setMessage("");
		try {
			const res = await authAxios.post("/integration/sync", { provider });
			setMessage(res.data.message);
			await loadStatus();
		} catch (err) {
			setMessage(
				err.response?.data?.message ||
					"Synchronization is not available right now."
			);
		} finally {
			setIsLoading(false);
			setActiveProvider("");
		}
	};

	const providerLabels = status
		? Object.entries(status.providers).map(([name, value]) => ({
				name,
				enabled: value.enabled,
				connected: value.connected,
		  }))
		: [];

	return (
		<section className="mb-4 border border-gray-200 rounded bg-white p-3 shadow-sm">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-base font-semibold text-gray-900">
						Calendar integration
					</h2>
					<div className="mt-2 flex flex-wrap gap-2">
						{providerLabels.map((provider) => (
							<span
								key={provider.name}
								className={`rounded px-2 py-1 text-xs font-medium ${
									provider.enabled
										? "bg-green-100 text-green-800"
										: "bg-gray-100 text-gray-700"
								}`}>
								{provider.name}:{" "}
								{provider.connected
									? "connected"
									: provider.enabled
									? "configured"
									: "local"}
							</span>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2">
					{status && (
						<div className="mr-1 text-sm text-gray-700">
							{status.totals.totalEvents} events,{" "}
							{status.totals.pendingEvents} pending
						</div>
					)}
					{providerLabels
						.filter((provider) => provider.name === "google" || provider.name === "outlook")
						.map((provider) =>
							provider.connected ? (
								<button
									key={provider.name}
									type="button"
									onClick={() => handleSync(provider.name)}
									disabled={isLoading}
									className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
									{isLoading && activeProvider === provider.name
										? "Syncing..."
										: `Sync ${provider.name}`}
								</button>
							) : (
								<button
									key={provider.name}
									type="button"
									onClick={() => handleConnect(provider.name)}
									disabled={isLoading || !provider.enabled}
									className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60">
									{isLoading && activeProvider === provider.name
										? "Connecting..."
										: `Connect ${provider.name}`}
								</button>
							)
						)}
				</div>
			</div>

			{message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
		</section>
	);
};
