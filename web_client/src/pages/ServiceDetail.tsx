import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Action {
  name: string;
  description: string;
}

interface Reaction {
  name: string;
  description: string;
}

interface Service {
  name: string;
  actions: Action[];
  reactions: Reaction[];
}

interface AboutResponse {
  server: {
    services: Service[];
  };
}

function ServiceDetail() {
  const { serviceName } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/about.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: AboutResponse = await response.json();
        const foundService = data.server.services.find(
          s => s.name.toLowerCase() === serviceName?.toLowerCase()
        );
        if (!foundService) {
          throw new Error("Service not found");
        }

        setService(foundService);
      } catch (err) {
        setError("Failed to load service details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [serviceName]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  }

return ( 
    <div className="px-10 py-12 max-w-5xl mx-auto">
      <a
        href="/explore"
        className="text-blue-600 hover:underline inline-block mb-6"
      >
        ← Back to Explore
      </a>


      {/* Service Details */}
      {service && (
        <>
          <h1 className="text-4xl font-bold text-gray-900 mb-6 capitalize">
            {service.name}
          </h1>

          {/* Actions */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">Actions</h2>
            {service.actions.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {service.actions.map((action, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow">
                    <h3 className="font-bold text-lg text-gray-800">
                      {action.name.replaceAll("_", " ")}
                    </h3>
                    <p className="text-gray-600 mt-2">{action.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No actions available.</p>
            )}
          </section>

          {/* Reactions */}
          <section>
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">Reactions</h2>
            {service.reactions.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {service.reactions.map((reaction, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow">
                    <h3 className="font-bold text-lg text-gray-800">
                      {reaction.name.replaceAll("_", " ")}
                    </h3>
                    <p className="text-gray-600 mt-2">{reaction.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reactions available.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default ServiceDetail;