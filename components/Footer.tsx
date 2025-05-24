import Link from "next/link";
import Logo from "./new/Logo";
import FooterTop from "./new/FooterTop";
import SocialMedia from "./new/SocialMedia";
import { categoriesData, quickLinksData } from "@/constants";

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top section with contact info */}
        {/* <FooterTop /> */}

        <div className="py-12 flex justify-center items-center">
          <div className="space-y-4 text-center">
           
            <div className="flex justify-center">
              <Logo children={undefined} />
            </div>

            <p className="text-gray-600 text-sm">
              Siguenos en Nuestras Redes
            </p>

            <div className="flex justify-center">
              <SocialMedia
                className="text-darkColor/60"
                iconClassName="border-darkColor/60 hover:border-darkColor hover:text-darkColor"
                tooltipClassName="bg-darkColor text-white"
              />
            </div>
          </div>
        </div>

        {/* <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo children={undefined} />
            <p className="text-gray-600 text-sm">
              Siguenos en Nuestras Redes
            </p>
            <SocialMedia
              className="text-darkColor/60"
              iconClassName="border-darkColor/60 hover:border-darkColor hover:text-darkColor"
              tooltipClassName="bg-darkColor text-white"
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Enlaces</h3>
            <ul className="space-y-3">
              {quickLinksData?.map((item) => (
                <li key={item?.title}>
                  <Link
                    href={item?.href}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium hoverEffect"
                  >
                    {item?.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categorias</h3>
            <ul className="space-y-3">
              {categoriesData.map((item) => (
                <li key={item?.title}>
                  <Link
                    href={`/category/${item?.value}`}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium hoverEffect"
                  >
                    {item?.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Newsletter</h3>
            <p className="text-gray-600 text-sm mb-4">
              Subscribe to our newsletter to receive updates and exclusive
              offers.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              <button
                type="submit"
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div> */}

        {/* Bottom copyright section */}
        <div className="py-6 border-t text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Exploradores del Rey Panama all rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
