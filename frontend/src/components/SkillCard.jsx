import React from "react";

export default function SkillCard({ skill, onRequest }) {
  const paymentLabel =
    skill.payment_type === "barter" ? "Barter only"
    : skill.payment_type === "paid" ? `ZMK ${skill.price}`
    : `Barter or ZMK ${skill.price}`;

  return (
    <div className="bg-moss-100 text-black rounded-lg overflow-hidden shadow-md flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <span className="text-xs uppercase tracking-wide text-black font-semibold">
          {skill.category_name}
        </span>
        <h3 className="font-display text-xl mt-1 leading-snug text-black">{skill.title}</h3>
        <p className="text-sm text-black/80 mt-2 line-clamp-3">{skill.description}</p>
      </div>

      <div className="mx-5 border-t border-dashed border-white/30" />

      <div className="px-5 py-4 flex justify-between items-center mt-auto">
        <div className="text-sm text-black">
          <span className="font-medium">{skill.provider_name}</span>
          {skill.provider_verified && (
            <span className="ml-1 text-red-500" title="Verified student">✓</span>
          )}
        </div>
        <span className="text-xs font-semibold bg-white text-moss-900 px-2 py-1 rounded">
          {paymentLabel}
        </span>
      </div>

      {onRequest && (
        <button
          onClick={() => onRequest(skill)}
          className="bg-whitesmoke text-black py-2.5 text-sm font-medium hover:bg-moss-600 transition-colors"
        >
          Request this skill
        </button>
      )}
    </div>
  );
}