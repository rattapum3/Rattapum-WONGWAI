import React from 'react';

export default function StepNavigation({
  steps,
  currentStep,
  maxStepReached,
  validateCitizenAndProceed
}) {
  return (
    <div className="card shadow-sm border-0 mb-4 p-3 p-md-4" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
      <div className="position-relative d-flex justify-content-between align-items-center px-2 px-md-4" style={{ minHeight: '90px' }}>
        {/* Background track line (เริ่มที่ศูนย์กลาง 1 และจบที่ศูนย์กลาง 6 ไม่โผล่เกินออกนอกวงกลม) */}
        <div
          className="position-absolute"
          style={{
            top: '25px',
            height: '4px',
            backgroundColor: '#e5e7eb',
            zIndex: 0,
            left: 'calc(100% / 12)',
            right: 'calc(100% / 12)'
          }}
        />

        {/* Active green progress line (แสดงสีเขียวถึงขั้นตอนที่เรากรอกถึง) */}
        <div
          className="position-absolute"
          style={{
            top: '25px',
            height: '4px',
            backgroundColor: '#03A96B',
            zIndex: 0,
            left: 'calc(100% / 12)',
            width: `${((Math.max(currentStep, maxStepReached) - 1) / 5) * (100 * 5 / 6)}%`,
            transition: 'width 0.4s ease-in-out'
          }}
        />

        {steps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isReached = step.id <= maxStepReached;
          const isCompleted = isReached && !isCurrent;

          return (
            <div
              key={step.id}
              className="d-flex flex-column align-items-center position-relative"
              style={{ zIndex: 1, cursor: 'pointer', flex: 1 }}
              onClick={() => validateCitizenAndProceed(step.id)}
              title={`ไปยัง${step.title}`}
            >
              {/* Circle Step Badge */}
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: isCurrent ? '50px' : '44px',
                  height: isCurrent ? '50px' : '44px',
                  backgroundColor: isCurrent || isCompleted ? '#03A96B' : '#ffffff',
                  color: isCurrent || isCompleted ? '#ffffff' : '#6b7280',
                  border: isCurrent
                    ? '3px solid #028a57'
                    : isCompleted
                      ? '3px solid #03A96B'
                      : '2px solid #e2e8f0',
                  boxShadow: isCurrent
                    ? '0 0 0 4px rgba(3, 169, 107, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)'
                    : isCompleted
                      ? '0 2px 4px rgba(3, 169, 107, 0.2)'
                      : 'none',
                  transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                  fontSize: isCurrent ? '19px' : '17px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {isCompleted ? (
                  <i className="bi bi-check-lg" style={{ fontSize: '20px', strokeWidth: '1.5' }}></i>
                ) : (
                  step.id
                )}
              </div>

              {/* Step Label */}
              <span
                className="mt-2 text-center small"
                style={{
                  color: isCurrent || isCompleted ? '#03A96B' : '#6b7280',
                  fontWeight: isCurrent ? '700' : isCompleted ? '600' : '500',
                  fontSize: isCurrent ? '13.5px' : '13px',
                  lineHeight: '1.2'
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
