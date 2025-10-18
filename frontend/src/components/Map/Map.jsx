import React from "react";

export default function Map() {
  return (
    <section className="pt-16 sm:pt-20 md:pt-24 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6347] to-[#FF4500]">
              Notre Localisation
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl sm:max-w-3xl mx-auto px-2">
            Venez nous rendre visite dans notre restaurant au cœur de Paris
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
          {/* Info / Team Section */}
          <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
            <div className="bg-gradient-to-br from-[#FF6347] to-[#FF7F50] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
              {/* Background blobs */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-6 left-6 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full"></div>
                <div className="absolute bottom-6 right-6 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 bg-orange-200 rounded-full"></div>
              </div>

              {/* Content */}
              <div className="relative z-10 text-center text-white space-y-4 sm:space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Venez Nous Rendre Visite</h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-100">
                  Notre équipe passionnée vous accueille dans un cadre chaleureux et convivial
                </p>

                {/* Team Members */}
                <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
                  {[
                    { name: "Chef Ahmed", role: "Spécialiste Kebabs" },
                    { name: "Sarah", role: "Service Client" },
                  ].map((person) => (
                    <div key={person.name} className="text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                        <svg
                          className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-xs sm:text-sm text-gray-200">{person.role}</p>
                    </div>
                  ))}
                </div>

                {/* Contact */}
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 text-gray-900">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-[#FF6347]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">123 Rue de la Gastronomie</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-[#FF6347]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">01 23 45 67 89</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-[#FF6347] text-white p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-1">C-Kebab Paris</h3>
              <p className="text-sm sm:text-base text-red-100">75001 Paris, France</p>
            </div>
            <div className="h-64 sm:h-80 md:h-96 w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.3522219!3d48.856614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDUxJzIzLjgiTiAywrAyMScwOC4wIkU!5e0!3m2!1sfr!2sfr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="C-Kebab Location"
              />
            </div>
            <div className="p-4 sm:p-6 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h4 className="font-semibold text-gray-900">Horaires d'Ouverture</h4>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">
                  Lun-Ven: 11h-23h | Sam: 11h-00h | Dim: 12h-22h
                </p>
              </div>
              <a
                href="https://maps.google.com/?q=123+Rue+de+la+Gastronomie,+75001+Paris,+France"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FF6347] hover:bg-[#FF4500] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Itinéraire
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
