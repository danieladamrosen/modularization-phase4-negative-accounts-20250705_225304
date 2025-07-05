import { Card } from '@/components/ui/card';

interface CreditScoresSectionProps {
  transUnionLogo: string;
  equifaxLogo: string;
  experianLogo: string;
  scoreGaugeArc: string;
}

interface ScoreGaugeProps {
  logoSrc: string;
  logoAlt: string;
  logoClassName: string;
  scoreRating: string;
  score: number;
  scoreChange: number;
  startingScore: number;
  borderClassName?: string;
}

function ScoreGauge({
  logoSrc,
  logoAlt,
  logoClassName,
  scoreRating,
  score,
  scoreChange,
  startingScore,
  borderClassName,
  scoreGaugeArc
}: ScoreGaugeProps & { scoreGaugeArc: string }) {
  return (
    <div className={`space-y-3 ${borderClassName || ''}`}>
      <div className="flex items-start justify-center h-10 mb-2 -mt-1">
        <img
          src={logoSrc}
          alt={logoAlt}
          className={logoClassName}
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-48 h-24 mb-3">
          <img
            src={scoreGaugeArc}
            alt="Score Gauge"
            className="w-full h-full object-contain"
          />

          {/* Score Rating Text */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ marginBottom: '20px' }}
          >
            <div className="text-xs font-semibold text-gray-500">{scoreRating}</div>
          </div>

          {/* Score in center */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-end"
            style={{ marginBottom: '-5px' }}
          >
            <div className="text-5xl font-black text-gray-700">{score}</div>
          </div>

          {/* Score Change Badge */}
          <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
            +{scoreChange}
          </div>
        </div>

        {/* Starting Score Text */}
        <div className="text-sm font-medium text-gray-600 mt-2">
          Starting Score: {startingScore}
        </div>
      </div>
    </div>
  );
}

export function CreditScoresSection({
  transUnionLogo,
  equifaxLogo,
  experianLogo,
  scoreGaugeArc
}: CreditScoresSectionProps) {
  return (
    <div className="mb-12 mt-12" data-section="credit-scores">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold text-gray-900">Credit Scores</h3>
        </div>
      </div>

      {/* Compact Score Gauges */}
      <div className="mb-6">
        <Card className="border-2 border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* TransUnion */}
            <ScoreGauge
              logoSrc={transUnionLogo}
              logoAlt="TransUnion"
              logoClassName="h-9 object-contain -mt-1"
              scoreRating="Very Good"
              score={742}
              scoreChange={12}
              startingScore={590}
              borderClassName="border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4"
              scoreGaugeArc={scoreGaugeArc}
            />

            {/* Equifax */}
            <ScoreGauge
              logoSrc={equifaxLogo}
              logoAlt="Equifax"
              logoClassName="h-6 object-contain mt-1"
              scoreRating="Fair"
              score={687}
              scoreChange={18}
              startingScore={590}
              borderClassName="border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4"
              scoreGaugeArc={scoreGaugeArc}
            />

            {/* Experian */}
            <ScoreGauge
              logoSrc={experianLogo}
              logoAlt="Experian"
              logoClassName="h-9 object-contain"
              scoreRating="Very Good"
              score={756}
              scoreChange={15}
              startingScore={590}
              scoreGaugeArc={scoreGaugeArc}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}