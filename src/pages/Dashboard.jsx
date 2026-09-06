import { useEffect, useState } from "react";
import {
    getDashboardStats,
    getAlerts,
    getAssets,
    getSOARActions,
} from "../services/dashboardApi";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [assets, setAssets] = useState([]);
    const [soarActions, setSoarActions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            setError(null);

            const [
                statsData,
                alertsData,
                assetsData,
                soarData,
            ] = await Promise.all([
                getDashboardStats(),
                getAlerts(),
                getAssets(),
                getSOARActions(),
            ]);

            setStats(statsData);
            setAlerts(
                alertsData?.alerts ||
                alertsData?.data ||
                []
            );

            setAssets(
                assetsData?.assets ||
                assetsData?.data ||
                []
            );

            setSoarActions(
                soarData?.actions ||
                soarData?.data ||
                []
            );

        } catch (err) {
            console.error(
                "Dashboard loading error:",
                err
            );

            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div>
                Loading SAOM-AI dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2>Dashboard Error</h2>

                <p>{error}</p>

                <button onClick={loadDashboard}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1>SAOM-AI Dashboard</h1>

            <section>
                <h2>Statistics</h2>

                <pre>
                    {JSON.stringify(
                        stats,
                        null,
                        2
                    )}
                </pre>
            </section>

            <section>
                <h2>Alerts</h2>

                <pre>
                    {JSON.stringify(
                        alerts,
                        null,
                        2
                    )}
                </pre>
            </section>

            <section>
                <h2>Assets</h2>

                <pre>
                    {JSON.stringify(
                        assets,
                        null,
                        2
                    )}
                </pre>
            </section>

            <section>
                <h2>SOAR Actions</h2>

                <pre>
                    {JSON.stringify(
                        soarActions,
                        null,
                        2
                    )}
                </pre>
            </section>
        </div>
    );
}

export default Dashboard;