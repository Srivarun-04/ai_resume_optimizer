import {Link, useNavigate} from "react-router";
import {usePuterStore} from "~/lib/puter";

const Navbar = () => {
    const { auth } = usePuterStore();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await auth.signOut();
        navigate('/auth');
    }

    return (
        <nav className="navbar">
            <Link to="/" className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="logo" className="w-10 h-10 object-contain rounded-xl" />
                <p className="text-2xl font-bold text-gradient">ResumeIQ</p>
            </Link>
            <div className="flex items-center gap-4">
                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>
                {auth.isAuthenticated && (
                    <button onClick={handleSignOut} className="text-sm font-semibold text-gray-600 hover:text-rose-600 transition-colors">
                        Sign Out
                    </button>
                )}
            </div>
        </nav>
    )
}
export default Navbar
