
export function DefaultBrandIcon({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 7.5c3 2.5 3 9.5 0 12M19.5 7.5c-3-2.5-3-9.5 0 12" />
    </svg>
  )
}

export function OrganizationBrand({ organization, compact = false }) {
  const hasLogo = Boolean(organization?.logoUrl)
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center overflow-hidden ${compact ? 'h-8 w-8' : 'h-14 w-14'}`}>
        {hasLogo ? <img src={organization.logoUrl} alt={`Logo de ${organization.name}`} className="h-full w-full object-contain transition-transform duration-700 ease-in-out hover:rotate-[360deg]" /> : <DefaultBrandIcon className={`${compact ? 'h-[18px] w-[18px]' : 'h-7 w-7'} text-primary transition-transform duration-700 ease-in-out hover:rotate-[360deg]`} />}
      </div>
      <span className={`${compact ? 'hidden text-base sm:inline' : 'text-3xl'} font-display font-extrabold tracking-tight`}>
        {organization?.name || <><span>MatchPoint </span><span className="text-primary">TC</span></>}
      </span>
    </div>
  )
}
