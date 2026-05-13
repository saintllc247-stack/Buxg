import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Card, TextField, Button, Typography, Alert, Container, Avatar,
} from '@mui/material'
import { AccountBalance } from '@mui/icons-material'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', company_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError('Заполните обязательные поля'); return }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
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
        <Typography variant="h5" fontWeight={700}>Регистрация</Typography>
        <Typography variant="body2" color="text.secondary">Создайте аккаунт для учёта</Typography>
      </Box>
      <Card sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Имя пользователя" fullWidth margin="normal" required autoFocus
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Email" type="email" fullWidth margin="normal" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Компания" fullWidth margin="normal" placeholder="Название вашей компании"
            value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <TextField label="Пароль" type="password" fullWidth margin="normal" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.5 }}
            disabled={loading}>
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </Button>
        </Box>
        <Typography textAlign="center" sx={{ mt: 3 }} variant="body2">
          Уже есть аккаунт? <Link to="/login" style={{ fontWeight: 600 }}>Войти</Link>
        </Typography>
      </Card>
    </Container>
  )
}
