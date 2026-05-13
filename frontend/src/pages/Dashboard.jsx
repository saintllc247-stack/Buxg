import { useState, useEffect, useCallback } from 'react'
import {
  Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Skeleton, Box, TextField, Button, Stack,
} from '@mui/material'
import { TrendingUp, TrendingDown, AccountBalanceWallet, FilterAlt } from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '../api'
import { useLang } from '../context/LangContext'

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#dc2626', '#9333ea']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, boxShadow: 2 }}>
        <Typography variant="body2" fontWeight={600}>{payload[0].name}</Typography>
        <Typography variant="body2" color="text.secondary">{Number(payload[0].value).toLocaleString()} сум</Typography>
      </Box>
    )
  }
  return null
}

export default function Dashboard() {
  const { t } = useLang()
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
      setError(e.response?.data?.detail || e.message || t('loadError'))
    })
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const handleReset = () => { setDateFrom(''); setDateTo('') }

  if (error) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="error" variant="h6" gutterBottom>{t('loadError')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{error}</Typography>
      <Button variant="outlined" onClick={load}>{t('retry')}</Button>
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
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField label={t('dateFrom')} type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextField label={t('dateTo')} type="date" size="small"
            InputLabelProps={{ shrink: true }}
            value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="contained" startIcon={<FilterAlt />} onClick={load}>{t('applyFilter')}</Button>
          {(dateFrom || dateTo) && (
            <Button variant="text" onClick={handleReset}>{t('resetFilter')}</Button>
          )}
        </Stack>
      </Grid>
      {statCards.map(({ key, icon, color, bg }) => (
        <Grid item xs={12} md={4} key={key}>
          <Card sx={{ bgcolor: bg, border: 'none', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color, display: 'flex' }}>{icon}</Box>
              <Box>
                <Typography variant="body2" color="text.secondary">{t(key === 'total_income' ? 'totalIncome' : key === 'total_expense' ? 'totalExpense' : 'balance')}</Typography>
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
            <Typography variant="h6" gutterBottom>{t('incomeByCategory')}</Typography>
            {data.income_by_category.length === 0
              ? <Typography color="text.secondary" py={4} textAlign="center">{t('noData')}</Typography>
              : <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.income_by_category} dataKey="amount" nameKey="name" cx="50%" cy="45%" outerRadius={90}>
                        {data.income_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
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
            <Typography variant="h6" gutterBottom>{t('expenseByCategory')}</Typography>
            {data.expense_by_category.length === 0
              ? <Typography color="text.secondary" py={4} textAlign="center">Нет данных</Typography>
              : <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.expense_by_category} dataKey="amount" nameKey="name" cx="50%" cy="45%" outerRadius={90}>
                        {data.expense_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
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
            <Typography variant="h6" gutterBottom>{t('recentTransactions')}</Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('date')}</TableCell>
                    <TableCell>{t('type')}</TableCell>
                    <TableCell align="right">{t('amount')}</TableCell>
                    <TableCell>{t('description')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}
                          color={t.type === 'income' ? 'success.main' : 'error.main'}>
                          {t.type === 'income' ? t('income') : t('expense')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{t.amount.toLocaleString()} сум</TableCell>
                      <TableCell>{t.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {data.recent_transactions.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>{t('noTransactions')}</TableCell></TableRow>
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

const statCards = [
  { key: 'total_income', icon: <TrendingUp />, color: '#16a34a', bg: '#f0fdf4' },
  { key: 'total_expense', icon: <TrendingDown />, color: '#dc2626', bg: '#fef2f2' },
  { key: 'balance', icon: <AccountBalanceWallet />, color: '#2563eb', bg: '#eff6ff' },
]

