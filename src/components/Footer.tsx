"use client";

import Link from "next/link";
import {
  FaYoutube,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { HiOutlineMail, HiPhone, HiChevronRight } from "react-icons/hi";

export default function Footer() {
  const year = new Date().getFullYear();
  const orange = "#FF7C18";
  const orangeHover = "#E2801C";

  return (
    <footer className="w-full mt-12 bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1 */}
        <div>
          <div className="mb-4">
            <Link href="/" className="inline-block">
              <img
                src="/logo-200-x-80.png"
                alt="NLWC logo"
                width={100}
                height={80}
              />
            </Link>
          </div>
          <p className="text-sm text-white">
            The New and Living Way Church (NLWC) is an amiable community of
            believers who are focused on inheriting the promise of Eternal Life
            in its fullness. Day after day we are learning to walk by the Spirit
            as we grow in the faith of the precious Son of God.
          </p>
        </div>

        {/* Columns 2 & 3 wrapper - side-by-side on mobile, span two columns on md+ */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-8">
          {/* Column 2: Quick Links */}
          <div className="sm:w-1/2">
            <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/about/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> About
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/audio-messages/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Audio Messages
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/house-fellowship/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> House Fellowships
                </Link>
              </li>
              <li>
                <Link
                  href="https://nlwc.church/blog/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Blog
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/contact/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="sm:w-1/2">
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/audio-broadcast/"
                  className="flex items-center gap-2 hover:text-[#E2801C] "
                >
                  <HiChevronRight color={orange} /> Listen live
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/video-broadcast/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Watch live
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/category/sunday-school-manual/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Sunday School Manuals
                </Link>
              </li>
              <li>
                <Link
                  href="https://ikorodu.nlwc.church/category/message-transcripts/"
                  className="flex items-center gap-2 hover:text-[#E2801C]"
                >
                  <HiChevronRight color={orange} /> Message Transcripts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Column 4: Subscribe & contact */}
        <div>
          <h3 className="font-semibold mb-4 text-white">Get Subscribed</h3>
          <p className="text-sm mb-4 text-white">
            Don't miss our future updates. Get Subscribed today!
          </p>

          <div className="flex items-center gap-3 mb-4">
            <Link
              href="#"
              className="text-[18px] p-2 rounded-full"
              style={{ color: orange }}
            >
              <FaYoutube />
            </Link>
            <Link
              href="#"
              className="text-[18px] p-2 rounded-full"
              style={{ color: orange }}
            >
              <FaFacebookF />
            </Link>
            <Link
              href="#"
              className="text-[18px] p-2 rounded-full"
              style={{ color: orange }}
            >
              <FaInstagram />
            </Link>
            <Link
              href="#"
              className="text-[18px] p-2 rounded-full"
              style={{ color: orange }}
            >
              <FaTwitter />
            </Link>
            <Link
              href="#"
              className="text-[18px] p-2 rounded-full"
              style={{ color: orange }}
            >
              <FaWhatsapp />
            </Link>
          </div>

          <ul className="space-y-2 text-sm text-white">
            <li className="flex items-center gap-2">
              <HiOutlineMail color={orange} />
              <Link
                href="mailto:ikoroduchurchadmin@nlwc.church"
                className="hover:text-[#E2801C]"
              >
                ikoroduchurchadmin@nlwc.church
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <HiPhone color={orange} />
              <Link href="tel:+2347035760085" className="hover:text-[#E2801C]">
                +234 703 576 0085
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center text-sm text-white">
          <div>Copyright {year} NLWC IKORODU. All right Reserved.</div>
          <div className="text-sm">&nbsp;</div>
        </div>
      </div>
    </footer>
  );
}
