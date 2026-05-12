import { createClient } from "@base44/sdk";
import { appParams, getBase44ServerOrigin } from "@/lib/app-params";

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const resolvedAppBase =
	(appBaseUrl || "").trim() ||
	(typeof window !== "undefined" ? window.location.origin : "");

export const base44 = createClient({
	appId: appId || "",
	token,
	functionsVersion,
	serverUrl: getBase44ServerOrigin(),
	requiresAuth: false,
	appBaseUrl: resolvedAppBase,
});
