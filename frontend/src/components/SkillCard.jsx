import React from "react";

export default function SkillCard({ skill, onRequest }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{skill.title}</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
          {skill.category_name}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
      <div className="mt-3 flex justify-between items-center text-sm">
        <div>
          <span className="font-medium">{skill.provider_name}</span>
          {skill.provider_verified && (
            <span className="ml-1 text-green-600" title="Verified student">✓</span>
          )}
        </div>
        <div className="text-right">
          {skill.payment_type === "barter" && <span>Barter only</span>}
          {skill.payment_type === "paid" && <span>${skill.price}</span>}
          {skill.payment_type === "both" && <span>Barter or ${skill.price}</span>}
        </div>
      </div>
      {onRequest && (
        <button
          onClick={() => onRequest(skill)}
          className="mt-3 w-full bg-indigo-600 text-white py-1.5 rounded hover:bg-indigo-700"
        >
          Request
        </button>
      )}
    </div>
  );
}
