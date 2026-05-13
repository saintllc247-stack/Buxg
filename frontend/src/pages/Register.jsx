import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { languageNames } from '../i18n/translations'
import {
  Box, Card, TextField, Button, Typography, Alert, Container, Avatar, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { AccountBalance } from '@mui/icons-material'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', company_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { t, lang, changeLang } = useLang()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError(t('fillRequired')); return }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || t('registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: { xs: 4, sm: 8 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar sx={{ mx: 'auto', mb: 1.5, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <AccountBalance sx={{ fontSize: 28 }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700}>{t('register')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('registerTitle')}</Typography>
        <Box sx={{ mt: 2 }}>
          <ToggleButtonGroup value={lang} exclusive onChange={(_, v) => v && changeLang(v)} size="small">
            {Object.entries(languageNames).map(([code, name]) => (
              <ToggleButton key={code} value={code} sx={{ px: 2, fontSize: '0.75rem' }}>{name}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>
      <Card sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label={t('username')} fullWidth margin="normal" required autoFocus
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label={t('email')} type="email" fullWidth margin="normal" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label={t('company')} fullWidth margin="normal" placeholder={t('companyPlaceholder')}
            value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <TextField label={t('password')} type="password" fullWidth margin="normal" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.5 }}
            disabled={loading}>
            {loading ? t('registering') : t('createAccount')}
          </Button>
        </Box>
        <Typography textAlign="center" sx={{ mt: 3 }} variant="body2">
          {t('hasAccount')} <Link to="/login" style={{ fontWeight: 600 }}>{t('login')}</Link>
        </Typography>
      </Card>
    </Container>
  )
}
