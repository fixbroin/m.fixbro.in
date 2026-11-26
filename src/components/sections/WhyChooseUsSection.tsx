
import { getWhyChooseUsContent } from '@/app/admin/settings/actions/why-choose-us-actions';
import DynamicIcon from '../DynamicIcon';
import ScrollAnimation from '../ScrollAnimation';
import { cn } from '@/lib/utils';

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default async function WhyChooseUsSection() {
  const content = await getWhyChooseUsContent();
  const youTubeId =
    content.media_type === 'video' && content.media_url
      ? getYouTubeVideoId(content.media_url)
      : null;

  return (
    <section
      id="why-choose-us"
      className="relative overflow-hidden py-24 lg:py-32 bg-black text-white"
    >
      {/* Full-bleed background video or image */}
      {content.media_url && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {content.media_type === 'video' ? (
            youTubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&loop=1&playlist=${youTubeId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0`}
                title={content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-[177.78vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
              />
            ) : (
              <video
                src={content.media_url}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controlsList="nodownload"
                disablePictureInPicture
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <img
              src={content.media_url}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Neutral dark scrim for crisp glass card readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.70) 100%)',
        }}
      />

      <div className="container relative z-10">
        {/* Centered Header */}
        <ScrollAnimation variant="fadeInUp" className="text-center mb-14 lg:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-white mb-4">
            {content.title}
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto rounded-full mb-5" />
          <p className="mx-auto max-w-2xl text-base md:text-lg font-normal leading-relaxed text-white/85">
            {content.subtitle}
          </p>
        </ScrollAnimation>

        {/* 4 Centered Frosted-Glass Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.features.map((feature, index) => (
            <ScrollAnimation key={feature.title} variant="fadeInUp" delay={index * 0.1} className="group">
              <div
                className={cn(
                  'relative flex flex-col items-center text-center gap-3 p-7 rounded-[1.5rem] transition-all duration-300 h-full',
                  'bg-black/35 backdrop-blur-xl border border-white/20 text-white shadow-xl',
                  'group-hover:bg-black/45 group-hover:border-white/35 group-hover:-translate-y-1.5'
                )}
              >
                <span className="font-display text-2xl font-semibold text-white/75 tracking-tight">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-colors duration-300">
                  <DynamicIcon name={feature.icon} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/80">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
