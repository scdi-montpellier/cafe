function AppVersion() {
  return (
    <div className="pt-2 text-sm text-cafe-300">
      v{window.appInfo.version} -{' '}
      <a
        href="https://www.scdi-montpellier.fr/servicesSCDI/CAFE/mentionslegales"
        target="_blank"
        rel="noreferrer"
      >
        Mentions légales
      </a>
    </div>
  )
}

export default AppVersion
