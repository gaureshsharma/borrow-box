import React from 'react';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { PageRoute } from '../Navbar';
import { TEAM_IMAGE_MAP } from '../../assets/teamImageRegistry';

interface HomeTeamSpotlightProps {
  onNavigate: (route: PageRoute) => void;
}

const FEATURED_MEMBERS = [
  {
    id: 'guide',
    name: 'Pradeep Kumar',
    role: 'Project Guide',
    tag: 'Mentor',
    image: TEAM_IMAGE_MAP['guide'],
  },
  {
    id: 'founder-1',
    name: 'Bhumika Khajuria',
    role: 'Co-Founder',
    tag: 'Founder',
    image: TEAM_IMAGE_MAP['founder-1'],
  },
  {
    id: 'founder-4',
    name: 'Gauresh Sharma',
    role: 'Co-Founder',
    tag: 'Founder',
    image: TEAM_IMAGE_MAP['founder-4'],
  },
  {
    id: 'founder-3',
    name: 'Shruti Singh',
    role: 'Co-Founder',
    tag: 'Founder',
    image: TEAM_IMAGE_MAP['founder-3'],
  },
  {
    id: 'founder-2',
    name: 'Lipi Gupta',
    role: 'Co-Founder',
    tag: 'Founder',
    image: TEAM_IMAGE_MAP['founder-2'],
  },
  {
    id: 'contributor',
    name: 'Krutarth Maru',
    role: 'Technical Lead',
    tag: 'Tech Lead',
    image: TEAM_IMAGE_MAP['contributor'],
  },
];

export const HomeTeamSpotlight: React.FC<HomeTeamSpotlightProps> = ({ onNavigate }) => {
  return (
    <section className="py-14 sm:py-20 border-t border-white/[0.08] relative bg-[#0B0F19]/50">
      <div className="bb-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161E2E] border border-white/[0.08] text-xs font-semibold text-[#A78BFA] mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>THE BORROOWBOX TEAM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              Meet the People Behind BorroowBox
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5 max-w-xl">
              Behind BorroowBox is a dedicated team working to make everyday products accessible through peer rentals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigate({ page: 'team' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161E2E] hover:bg-[#1D293B] border border-white/[0.08] hover:border-[#8B5CF6]/40 text-xs sm:text-sm font-semibold text-[#F8FAFC] bb-btn-interactive cursor-pointer shrink-0 self-start md:self-auto"
          >
            <span>View Full Team Page</span>
            <ArrowRight className="w-4 h-4 text-[#8B5CF6]" />
          </button>
        </div>

        {/* 6-Column Grid on Desktop, 3 on Tablet, 2 on Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {FEATURED_MEMBERS.map((member) => (
            <div
              key={member.id}
              onClick={() => {
                onNavigate({ page: 'team' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group relative rounded-2xl bg-[#161E2E] hover:bg-[#1D293B] border border-white/[0.08] hover:border-[#8B5CF6]/50 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col shadow-lg"
            >
              {/* Photo */}
              <div className="aspect-[4/5] w-full overflow-hidden bg-[#111827] relative">
                <img
                  src={member.image}
                  alt={`${member.name} — ${member.role}`}
                  className="w-full h-full object-cover object-[50%_18%] group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161E2E] via-transparent to-transparent opacity-80" />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0B0F19]/80 border border-white/[0.1] text-[#A78BFA]">
                  {member.tag}
                </span>
              </div>

              {/* Info */}
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A78BFA]">
                    {member.role}
                  </p>
                  <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight mt-0.5 truncate">
                    {member.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
