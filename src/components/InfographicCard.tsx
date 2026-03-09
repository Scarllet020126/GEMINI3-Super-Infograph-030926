import React from "react";
import { motion } from "motion/react";

export const InfographicCard: React.FC<{ topic: any; language: string }> = ({
  topic,
  language,
}) => {
  const isEn = language === "en";
  const title = isEn ? topic.title_en : topic.title_zh;
  const summary = isEn ? topic.summary_en : topic.summary_zh;
  const whyItMatters = isEn ? topic.why_it_matters_en : topic.why_it_matters_zh;

  const renderVisual = () => {
    const type = topic.suggested_infographic_type;
    const data = topic.data || [];

    if (type === "timeline") {
      return (
        <div className="flex flex-col gap-4 mt-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-current before:to-transparent before:opacity-20">
          {data.map((item: any, i: number) => (
            <div
              key={i}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white painter-bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {i + 1}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] painter-card p-4">
                <h4 className="font-bold painter-primary">
                  {isEn ? item.label_en : item.label_zh}
                </h4>
                <p className="text-sm mt-1 opacity-80">
                  {isEn ? item.value_en : item.value_zh}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === "flowchart") {
      return (
        <div className="flex flex-col items-center gap-2 mt-6">
          {data.map((item: any, i: number) => (
            <React.Fragment key={i}>
              <div className="painter-card p-4 text-center w-full max-w-xs">
                <h4 className="font-bold painter-primary">
                  {isEn ? item.label_en : item.label_zh}
                </h4>
                <p className="text-sm mt-1 opacity-80">
                  {isEn ? item.value_en : item.value_zh}
                </p>
              </div>
              {i < data.length - 1 && (
                <div className="w-1 h-6 painter-bg-primary opacity-50 my-1"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (type === "comparison") {
      return (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {data.map((item: any, i: number) => (
            <div key={i} className="painter-card p-4 flex flex-col">
              <h4 className="font-bold painter-primary border-b border-current pb-2 mb-2">
                {isEn ? item.label_en : item.label_zh}
              </h4>
              <p className="text-sm opacity-80 flex-1">
                {isEn ? item.value_en : item.value_zh}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (type === "checklist") {
      return (
        <div className="flex flex-col gap-3 mt-6">
          {data.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 painter-card p-3">
              <div className="mt-0.5 painter-primary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <h4 className="font-bold">
                  {isEn ? item.label_en : item.label_zh}
                </h4>
                <p className="text-sm opacity-80">
                  {isEn ? item.value_en : item.value_zh}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default / Layered
    return (
      <div className="flex flex-col gap-2 mt-6 items-center">
        {data.map((item: any, i: number) => (
          <div
            key={i}
            className="painter-card p-4 text-center"
            style={{ width: `${100 - i * 10}%`, opacity: 1 - i * 0.1 }}
          >
            <h4 className="font-bold painter-primary">
              {isEn ? item.label_en : item.label_zh}
            </h4>
            <p className="text-sm opacity-80">
              {isEn ? item.value_en : item.value_zh}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="painter-card p-6 flex flex-col h-full"
    >
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider painter-bg-primary text-white rounded mb-3">
          {topic.suggested_infographic_type}
        </span>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="opacity-80 leading-relaxed">{summary}</p>
      </div>

      <div className="flex-1">{renderVisual()}</div>

      <div className="mt-8 pt-4 border-t border-current border-opacity-20">
        <h4 className="font-bold text-sm uppercase tracking-wider mb-3 painter-secondary">
          {isEn ? "Why it matters" : "為什麼重要"}
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
          {whyItMatters?.map((point: string, i: number) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};
