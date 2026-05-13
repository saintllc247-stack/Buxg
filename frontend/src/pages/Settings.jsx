import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, TextField, Typography, Stack, Divider, Snackbar, Alert,
} from '@mui/material'
import { Save, Lock } from '@mui/icons-material'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ company_name: '', smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '' })
  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    api.get('/auth/settings').then((r) => setForm(r.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    try {
      await api.put('/auth/settings', form)
      setSnackbar({ open: true, message: 'Настройки сохранены', severity: 'success' })
      refreshUser()
    } catch (e) {
      setSnackbar({ open: true, message: 'Ошибка при сохранении', severity: 'error' })
    }
  }

  const handleChangePassword = async () => {
    if (passForm.new_password !== passForm.confirm) {
      setSnackbar({ open: true, message: 'Пароли не совпадают', severity: 'error' })
      return
    }
    if (passForm.new_password.length < 4) {
      setSnackbar({ open: true, message: 'Пароль должен быть минимум 4 символа', severity: 'error' })
      return
    }
    try {
      await api.post('/auth/change-password', { old_password: passForm.old_password, new_password: passForm.new_password })
      setSnackbar({ open: true, message: 'Пароль изменён', severity: 'success' })
      setPassForm({ old_password: '', new_password: '', confirm: '' })
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.detail || 'Ошибка', severity: 'error' })
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Настройки</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Компания</Typography>
          <TextField label="Название компании" fullWidth margin="normal"
            value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>SMTP для отправки счетов</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Настройте SMTP-сервер, чтобы отправлять счета клиентам на email
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField label="SMTP Хост" fullWidth margin="normal"
              value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} />
            <TextField label="SMTP Порт" type="number" fullWidth margin="normal" sx={{ maxWidth: 150 }}
              value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })} />
          </Stack>
          <TextField label="SMTP Пользователь (Email)" fullWidth margin="normal"
            value={form.smtp_user} onChange={(e) => setForm({ ...form, smtp_user: e.target.value })} />
          <TextField label="SMTP Пароль" type="password" fullWidth margin="normal"
            value={form.smtp_password} onChange={(e) => setForm({ ...form, smtp_password: e.target.value })} />

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Сохранить</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Смена пароля</Typography>
          <TextField label="Текущий пароль" type="password" fullWidth margin="normal"
            value={passForm.old_password} onChange={(e) => setPassForm({ ...passForm, old_password: e.target.value })} />
          <TextField label="Новый пароль" type="password" fullWidth margin="normal"
            value={passForm.new_password} onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })} />
          <TextField label="Подтвердите пароль" type="password" fullWidth margin="normal"
            value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} />
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Lock />} onClick={handleChangePassword}
              disabled={!passForm.old_password || !passForm.new_password || !passForm.confirm}>
              Сменить пароль
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
