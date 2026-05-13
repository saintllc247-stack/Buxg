import { useState, useEffect } from 'react'
import { Button, Snackbar, Box, Typography } from '@mui/material'
import { InstallMobile } from '@mui/icons-material'
import { useLang } from '../context/LangContext'

export default function PwaInstallPrompt() {
  const { t } = useLang()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
    setShow(false)
  }

  const handleDismiss = () => setShow(false)

  if (!show) return null

  return (
    <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, maxWidth: 400 }}>
        <InstallMobile />
        <Typography variant="body2" sx={{ flex: 1 }}>{t('installApp')}</Typography>
        <Button size="small" variant="contained" color="secondary" onClick={handleInstall}>{t('install')}</Button>
        <Button size="small" color="inherit" onClick={handleDismiss}>✕</Button>
      </Box>
    </Snackbar>
  )
}