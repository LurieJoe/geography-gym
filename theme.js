(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const readJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null')
    } catch {
      return null
    }
  }

  const getAppearancePreferences = () => {
    const store = readJson('geography-gym-profiles-v1')
    const activeProfile = store?.profiles?.find(
      (profile) => profile.id === store.activeProfileId,
    )
    const profileTheme = activeProfile?.preferences?.theme
    const legacyTheme = readJson('geography-gym-preferences')?.theme
    return {
      theme: ['system', 'light', 'dark'].includes(profileTheme)
        ? profileTheme
        : ['system', 'light', 'dark'].includes(legacyTheme)
          ? legacyTheme
          : 'system',
      highContrast: activeProfile?.preferences?.highContrast === true,
      fontSize: ['s', 'm', 'l', 'xl'].includes(activeProfile?.preferences?.fontSize)
        ? activeProfile.preferences.fontSize
        : 'm',
    }
  }

  const applyTheme = () => {
    const preferences = getAppearancePreferences()
    const theme = preferences.theme === 'system' ? (media.matches ? 'dark' : 'light') : preferences.theme
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-high-contrast', String(preferences.highContrast))
    document.documentElement.setAttribute('data-font-size', preferences.fontSize)
  }

  applyTheme()
  media.addEventListener('change', () => {
    if (getAppearancePreferences().theme === 'system') applyTheme()
  })
  window.addEventListener('storage', (event) => {
    if (
      event.key === 'geography-gym-profiles-v1' ||
      event.key === 'geography-gym-preferences'
    ) {
      applyTheme()
    }
  })
})()
