import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/career-analysis/:resumeId', 'routes/career-analysis.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
] satisfies RouteConfig;
