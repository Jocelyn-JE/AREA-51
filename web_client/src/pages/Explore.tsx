function Explore() {
  return (
    <div className="min-h-screen bg-gray-50 w-screen flex flex-1 flex-col justify-center items-center text-center px-6">
      {/* Hero section */}
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Connect your apps and automate tasks
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Just like IFTTT, AREA lets you create automations between your
          favorite services. Create an Action in one app, and trigger a
          Reaction in another — without code.
        </p>

        <div className="flex gap-4">
          <a
            href="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            Get Started
          </a>
          <a
            href="/explore"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300"
          >
            Explore Services
          </a>
          </div>
      </div>
  );
}

export default Explore;
