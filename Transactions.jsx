import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Typography, IconButton, Tab, Tabs, Stack, Snackbar, Alert,
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import api from '../api'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [typeTab, setTypeTab] = useState('income')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'income' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const load = () => api.get('/categories').then((r) => setCategories(r.data))

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    await api.post('/categories', { ...form, type: typeTab })
    setOpen(false)
    setForm({ name: '', type: typeTab })
    load()
  }

  const handleDelete = async (id) => {
    if (confirm('Удалить категорию?')) {
      await api.delete(`/categories/${id}`)
      load()
    }
  }

  const filtered = categories.filter((c) => c.type === typeTab)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Категории</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ name: '', type: typeTab }); setOpen(true) }}>
          Добавить
        </Button>
      </Box>

      <Tabs value={typeTab} onChange={(_, v) => setTypeTab(v)} sx={{ mb: 2 }}>
        <Tab label="Доходы" value="income" />
        <Tab label="Расходы" value="expense" />
      </Tabs>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell width={80}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell fontWeight={600}>{c.name}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4 }}>Нет категорий</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Новая категория</DialogTitle>
        <DialogContent>
          <TextField label="Название" fullWidth margin="normal" required autoFocus
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name}>Добавить</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
