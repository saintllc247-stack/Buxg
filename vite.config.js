import { useState, useEffect, useCallback } from 'react'
import {
  Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Skeleton, Box, TextField, Button, Stack,
} from '@mui/material'
import { TrendingUp, TrendingDown, AccountBalanceWallet, FilterAlt } from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import api from '../api'

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#dc2626', '#9333ea']

const statCards = [
  { key: 'total_income', label: 'Доходы', icon: <TrendingUp />, color: '#16a34a', bg: '#f0fdf4' },
  { key: 'total_expense', label: 'Расходы', icon: <TrendingDown />, color: '#dc2626', bg: '#fef2f2' },
  { key: 'balance', label: 'Баланс', icon: <AccountBalanceWallet />, color: '#2563eb', bg: '#eff6ff' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(() => {
    setError('')
    const params = {}
    if (dateFrom) params.from = dateFrom
    if (dateTo) params.to = dateTo
    api.get('/reports/dashboard', { params }).then((r) => setData(r.data)).catch((e) => {
      setError(e.response?.data?.detail || e.message || 'Ошибка загрузки')
    })
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  if (error) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error" variant="h6" gutterBottom>Ошибка загрузки</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{error}</Typography>
      <Button variant="outlined" onClick={load}>Повторить</Button>
    </Box>
  )

  if (!data) return (
    <Grid container spacing={3}>
      {[1,2,3].map(i => <Grid item xs={12} md={4} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}
    </Grid>
  )

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="От" type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextField label="До" type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" startIcon={<FilterAlt />} onClick={load}>Применить</Button>
          {(dateFrom || dateTo) && (
            <Button variant="text" onClick={() => { setDateFrom(''); setDateTo('') }}>Сбросить</Button>
          )}
        </Stack>
      </Grid>
      {statCards.map(({ key, label, icon, color, bg }) => (
        <Grid item xs={12} md={4} key={key}>
          <Card sx={{ bgcolor: bg, border: 'none', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color, display: 'flex' }}>{icon}</Box>
              <Box>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={700} color={key === 'balance' ? (data.balance >= 0 ? 'primary.main' : 'error.main') : color}>
                  {Number(data[key]).toLocaleString()} сум
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Доходы по категориям</Typography>
            {data.income_by_category.length === 0
              ? <Typography color="text.secondary" py={4} textAlign="center">Нет данных</Typography>
              : <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.income_by_category} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {data.income_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
            }
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Расходы по категориям</Typography>
            {data.expense_by_category.length === 0
              ? <Typography color="text.secondary" py={4} textAlign="center">Нет данных</Typography>
              : <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.expense_by_category} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {data.expense_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
            }
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Последние транзакции</Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Описание</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}
                          color={t.type === 'income' ? 'success.main' : 'error.main'}>
                          {t.type === 'income' ? 'Доход' : 'Расход'}
                        </Typography>
                      </TableCell>
                      <TableCell>{t.amount.toLocaleString()} сум</TableCell>
                      <TableCell>{t.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {data.recent_transactions.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Нет транзакций</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
