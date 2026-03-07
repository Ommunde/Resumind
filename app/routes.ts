import { type RouteConfig, index, route } from "@react-router/dev/routes";
import Upload from "./routes/upload";

export default [
    index("routes/home.tsx"), 
    route('/auth', 'routes/auth.tsx'), 
    route('/upload', 'routes/upload.tsx'),
] satisfies RouteConfig;
