import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Card, TextField, Button, Typography, Alert, Container, InputAdornment, IconButton, Avatar,
} from '@mui/material'
import { Visibility, VisibilityOff, AccountBalance, Lock } from '@mui/icons-material'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Заполните все поля'); return }
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch {
      setError('Неверное имя пользователя или пароль')
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
        <Typography variant="h5" fontWeight={700}>Бухгалтерия</Typography>
        <Typography variant="body2" color="text.secondary">Войдите в систему учёта</Typography>
      </Box>
      <Card sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Имя пользователя" fullWidth margin="normal" required autoFocus
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Пароль" type={showPw ? 'text' : 'password'} fullWidth margin="normal" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPw(!showPw)} edge="end">
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )}} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.5 }}
            disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Box>
        <Typography textAlign="center" sx={{ mt: 3 }} variant="body2">
          Нет аккаунта? <Link to="/register" style={{ fontWeight: 600 }}>Зарегистрироваться</Link>
        </Typography>
      </Card>
    </Container>
  )
}
