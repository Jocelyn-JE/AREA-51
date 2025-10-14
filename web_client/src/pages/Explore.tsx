import { useEffect, useState } from "react";

interface Service {
  name: string;
}

interface AboutResponse {
  server: {
    services: Service[];
  };
}


function Explore() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/about.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: AboutResponse = await response.json();
        setServices(data.server.services);
        setFilteredServices(data.server.services);
      } catch (err) {
        setError("Failed to load services. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const filtered = services.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [search, services]);

  return (
    <div className="flex flex-col items-center text-center px-12 py-10 w-full">
      <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
        Connect your apps and automate tasks
      </h2>
      <p className="text-xl text-gray-600 mb-10 max-w-4xl">
        Explore all available services that AREA can connect to.
      </p>

      {/* Search bar */}
      <div className="w-full max-w-md mb-10">
        <input
          type="text"
          placeholder="Search for a service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading / Error states */}
      {loading && <p className="text-gray-500">Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Services list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-6 center">
        {filteredServices.map((service, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-200"
          >
            <h3 className="text-xl font-semibold text-blue-600 capitalize">
              {service.name}
            </h3>
          </div>
        ))}
      </div>

      {/* No results found */}
      {!loading && filteredServices.length === 0 && !error && (
        <p className="text-gray-500 mt-8">
          No services found matching "{search}".
        </p>
      )}
    </div>
  );
}

export default Explore;
