import React from 'react';

/**
 * Parses an indicator title into its main title and an optional subtitle / parenthetical note
 * specifically formatted for Capaian Indikator Kinerja displays.
 */
export function parseIndicatorTitle(name: string): { main: string; sub: string | null } {
  if (!name || typeof name !== 'string') {
    return { main: '', sub: null };
  }

  const trimmed = name.trim();

  // Strip existing trailing parenthesis if any, to analyze the clean base title
  let cleanBase = trimmed;
  let existingSub: string | null = null;
  const parenMatch = trimmed.match(/^(.*?)\s*(\([^\)]+\))\s*$/);
  if (parenMatch && parenMatch[1].length > 2) {
    cleanBase = parenMatch[1].trim();
    existingSub = parenMatch[2].trim();
  }

  const lowerBase = cleanBase?.toLowerCase();

  // Rule 1: Persentase konten siaran yang menunjang program Prioritas Presiden -> (TalkShow, Dialog Interaktif, ILM)
  if (lowerBase.includes('prioritas presiden')) {
    return {
      main: cleanBase,
      sub: '(TalkShow, Dialog Interaktif, ILM)'
    };
  }

  // Rule 2: Jumlah kelompok masyarakat yang dilibatkan dalam siaran -> (Hard News, Features, Event, Dialog Interaktif)
  if (lowerBase.includes('kelompok masyarakat') || (lowerBase.includes('masyarakat') && lowerBase.includes('siaran'))) {
    return {
      main: cleanBase,
      sub: '(Hard News, Features, Event, Dialog Interaktif)'
    };
  }

  // Rule 3: Jumlah Produksi Berita Radio -> (Isu Lokal, Nasional, Layanan Publik)
  if (lowerBase.includes('berita radio')) {
    return {
      main: cleanBase,
      sub: '(Isu Lokal, Nasional, Layanan Publik)'
    };
  }

  // Rule 4: Jumlah Minimal Berita Online / Produksi Berita Online -> (Isu Lokal, Nasional, Layanan Publik)
  if (lowerBase.includes('berita online')) {
    return {
      main: cleanBase,
      sub: '(Isu Lokal, Nasional, Layanan Publik)'
    };
  }

  // Rule 5: jumlah berita ringan yang diproduksi oleh LPU / Berita Ringan -> (ke KBRN)
  if (lowerBase.includes('berita ringan') || (lowerBase.includes('lpu') && lowerBase.includes('berita'))) {
    return {
      main: cleanBase,
      sub: '(ke KBRN)'
    };
  }

  // Rule 6: Persentase produksi siaran yang didistribusikan secara digital / Digitalisasi Studio & Media Baru -> (Website, Podcast, Media Sosial)
  if (
    lowerBase.includes('didistribusikan secara digital') || 
    lowerBase.includes('distribusi digital') ||
    lowerBase.includes('digitalisasi studio')
  ) {
    return {
      main: cleanBase,
      sub: '(Website, Podcast, Media Sosial)'
    };
  }

  // Fallback 1: Explicit newline separation
  if (trimmed.includes('\n')) {
    const parts = trimmed.split('\n');
    return {
      main: parts[0].trim(),
      sub: parts.slice(1).join(' ').trim()
    };
  }

  // Fallback 2: Any existing parenthetical subtitle
  if (existingSub) {
    return {
      main: cleanBase,
      sub: existingSub
    };
  }

  return {
    main: trimmed,
    sub: null
  };
}

interface IndicatorTitleDisplayProps {
  title: string;
  className?: string;
  subClassName?: string;
  mainClassName?: string;
}

export const IndicatorTitleDisplay: React.FC<IndicatorTitleDisplayProps> = ({
  title,
  className = "text-xs font-bold text-slate-800 leading-snug",
  subClassName = "text-[10px] text-slate-500 font-normal block mt-0.5",
  mainClassName = "block"
}) => {
  const { main, sub } = parseIndicatorTitle(title);

  return (
    <span className={className} title={title}>
      <span className={mainClassName}>{main}</span>
      {sub && <span className={subClassName}>{sub}</span>}
    </span>
  );
};

export default IndicatorTitleDisplay;
