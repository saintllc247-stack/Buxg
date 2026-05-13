import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Typography, IconButton, Stack,
} from '@mui/material'
import { Add, Edit, Delete, Download } from '@mui/icons-material'
import api from '../api'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', tin: '' })

  useEffect(() => { api.get('/clients').then((r) => setClients(r.data)) }, [])

  const handleSave = async () => {
    if (edit) await api.put(`/clients/${edit.id}`, form)
    else await api.post('/clients', form)
    setOpen(false); setEdit(null)
    const r = await api.get('/clients')
    setClients(r.data)
  }

  const handleDelete = async (id) => {
    if (confirm('Удалить клиента?')) {
      await api.delete(`/clients/${id}`)
      setClients(clients.filter((c) => c.id !== id))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Клиенты</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Download />}
            onClick={() => window.open('/api/exports/clients/excel', '_blank')}>
            Excel
          </Button>
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEdit(null); setForm({ name: '', email: '', phone: '', address: '', tin: '' }); setOpen(true) }}>
            Добавить
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Телефон</TableCell>
                  <TableCell>ИНН</TableCell>
                  <TableCell width={80}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell fontWeight={600}>{c.name}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>{c.tin || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setEdit(c); setForm(c); setOpen(true) }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Нет клиентов</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{edit ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
        <DialogContent>
          <TextField label="Название / Имя" fullWidth margin="normal" required autoFocus
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Email" fullWidth margin="normal"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Телефон" fullWidth margin="normal"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Адрес" fullWidth margin="normal" multiline rows={2}
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="ИНН" fullWidth margin="normal"
            value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
