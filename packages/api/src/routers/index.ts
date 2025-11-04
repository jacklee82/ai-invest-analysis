import { router } from "../index";
import { dashboardRouter } from "./dashboard";
import { riskRouter } from "./risk";
import { simulationRouter } from "./simulation";
import { analysisRouter } from "./analysis";
import { uploadRouter } from "./upload";
import { projectRouter } from "./project";

/**
 * 애플리케이션 루트 라우터
 * 모든 네임스페이스 라우터를 통합
 */
export const appRouter = router({
	dashboard: dashboardRouter,
	risk: riskRouter,
	simulation: simulationRouter,
	analysis: analysisRouter,
	upload: uploadRouter,
	project: projectRouter,
});

export type AppRouter = typeof appRouter;
