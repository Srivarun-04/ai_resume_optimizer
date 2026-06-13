import { cn } from "~/lib/utils";

interface RecommendedRolesProps {
    roles: { role: string; confidence: number; reason?: string }[];
}

const medals = ["🥇", "🥈", "🥉"];

const RecommendedRoles: React.FC<RecommendedRolesProps> = ({ roles }) => {
    if (!roles || roles.length === 0) {
        return (
            <div className="dash-card bg-white border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🎯</span>
                    <h3 className="text-sm font-bold text-gray-800">Recommended Job Roles</h3>
                </div>
                <p className="text-xs text-gray-400 italic">
                    No role recommendations available. Upload a resume to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="dash-card bg-white border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <h3 className="text-sm font-bold text-gray-800">Recommended Job Roles</h3>
                <span className="ml-auto text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                    Top {roles.length}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roles.slice(0, 3).map((rec, i) => {
                    const barColor = rec.confidence > 74
                        ? "bg-emerald-500"
                        : rec.confidence > 49
                            ? "bg-amber-500"
                            : "bg-red-400";

                    const badgeBg = rec.confidence > 74
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : rec.confidence > 49
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200";

                    return (
                        <div
                            key={i}
                            className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3 bg-gradient-to-b from-gray-50 to-white"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{medals[i] || "🏅"}</span>
                                    <p className="text-sm font-bold text-gray-800">{rec.role}</p>
                                </div>
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", badgeBg)}>
                                    {rec.confidence}%
                                </span>
                            </div>

                            {/* Confidence bar */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                    style={{ width: `${rec.confidence}%` }}
                                />
                            </div>

                            {rec.reason && (
                                <p className="text-xs text-gray-500 leading-relaxed">{rec.reason}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecommendedRoles;
