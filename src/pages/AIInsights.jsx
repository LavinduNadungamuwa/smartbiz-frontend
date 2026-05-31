import { useState } from 'react';
import { AreaChart, ChartCard, LineChart } from '../components/charts';
import Button from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import { askAi, useBusinessData } from '../api/resources';
import { currency, lastMonthsSeries, number, productStatus } from '../utils/formatters';

export default function AIInsights() {
  const { data, loading, error, reload } = useBusinessData();
  const [question, setQuestion] = useState('What should I focus on today?');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  if (loading) return <LoadingState message="Loading AI insights..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const revenue = lastMonthsSeries(data.sales, 'saleDate', 'totalAmount');
  const lowStock = data.products.filter((product) => productStatus(product.stockQuantity) !== 'In Stock');

  const cards = [
    ['Business performance summary', `Revenue is ${currency(data.summary.totalRevenue)} across ${number(data.summary.totalSales)} sales.`],
    ['Inventory predictions', lowStock.length ? `${lowStock.length} products need stock attention.` : 'No low-stock products found in the database.'],
    ['Revenue forecasting', `Current month revenue is ${currency(revenue.raw.at(-1))}.`],
    ['Expense analysis', `Recorded expenses total ${currency(data.summary.totalExpenses)}.`],
    ['Customer behavior insights', `${number(data.customers.length)} customer records are available for analysis.`],
    ['Recommended actions', lowStock.length ? `Review ${lowStock[0].productName} first.` : 'Keep monitoring sales and invoice collections.'],
  ];

  const handleAsk = async () => {
    setAsking(true);
    setAnswer('');
    try {
      const res = await askAi(question);
      setAnswer(res.data?.answer || 'No answer returned.');
    } catch (err) {
      setAnswer(err.response?.data?.message || err.message || 'AI request failed.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="AI Insights"
        title="Business assistant"
        description="Live AI assistant connected to the SmartBiz backend."
        actions={<Button icon="ai" onClick={handleAsk}>{asking ? 'Asking...' : 'Ask SmartBiz AI'}</Button>}
      />
      <section className="assistant-hero card">
        <div className="ai-orb large">AI</div>
        <div>
          <h2>Your assistant is using live business records.</h2>
          <p>{`SmartBiz can reason over ${number(data.customers.length)} customers, ${number(data.products.length)} products, ${number(data.sales.length)} sales, and ${number(data.invoices.length)} invoices.`}</p>
        </div>
      </section>
      <section className="ai-grid">
        {cards.map(([title, text]) => (
          <article className="card ai-tile" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="dashboard-grid two">
        <ChartCard title="Revenue Forecasting" subtitle="Sales totals by month">
          <LineChart data={revenue.values} labels={revenue.labels} />
        </ChartCard>
        <ChartCard title="Sales Prediction" subtitle="Likely sales trend">
          <AreaChart data={revenue.values} />
        </ChartCard>
      </section>
      <section className="card conversation-card">
        <label className="ai-question">
          <span>Ask a business question</span>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <div className="chat-row ai">
          <strong>SmartBiz AI</strong>
          <p>{answer || 'Ask a question to receive a live backend response.'}</p>
        </div>
      </section>
    </div>
  );
}
