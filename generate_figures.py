import matplotlib.pyplot as plt
import numpy as np
import scipy.stats as stats

def generate_figure_3():
    """Generates the Bar Chart for Token Compression Efficiency."""
    pipelines = ['Baseline\n(Brute-force)', 'Standard RAG', 'Proposed System']
    avg_tokens = [12500, 3000, 1150]
    colors = ['#ef4444', '#f97316', '#2563eb'] # Red, Orange, Blue

    fig, ax = plt.subplots(figsize=(8, 6))
    bars = ax.bar(pipelines, avg_tokens, color=colors, edgecolor='black', zorder=3)

    # Adding values on top of the bars
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, yval + 300, f"{yval:,}", ha='center', va='bottom', fontweight='bold', fontsize=11)

    # Formatting
    ax.set_ylabel('Average Token Count (Log Scale)', fontsize=12, fontweight='bold')
    ax.set_title('Token Compression Efficiency Across Pipelines', fontsize=14, fontweight='bold', pad=20)
    ax.set_yscale('log') # Log scale is better when comparing large differences (12k vs 1k)
    
    # Customizing y-axis ticks for log scale clarity
    ax.set_yticks([1000, 3000, 10000, 15000])
    ax.get_yaxis().set_major_formatter(plt.ScalarFormatter())

    ax.grid(axis='y', linestyle='--', alpha=0.7, zorder=0)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()
    plt.savefig('figure3_token_compression.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Successfully generated: figure3_token_compression.png")

def generate_figure_4():
    """Generates the Normal Distribution Curve for Z-Score thresholds."""
    # Generate data for normal distribution (mean=0, std=1)
    x = np.linspace(-4, 4, 1000)
    y = stats.norm.pdf(x, 0, 1)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(x, y, color='#1e293b', linewidth=2, zorder=3)

    # Fill areas based on thresholds
    # Normal Noise (Z < 0.5)
    ax.fill_between(x, y, where=(x < 0.5), color='#94a3b8', alpha=0.4, label='Normal Noise (Discarded)')
    
    # Moderate Anomalies (0.5 <= Z < 3.0)
    ax.fill_between(x, y, where=((x >= 0.5) & (x < 3.0)), color='#60a5fa', alpha=0.6, label='Anomalies (Retained)')
    
    # Extreme Anomalies (Z >= 3.0)
    ax.fill_between(x, y, where=(x >= 3.0), color='#ef4444', alpha=0.8, label='Extreme Anomalies (Prepended)')

    # Add vertical lines for thresholds
    ax.axvline(0.5, color='#475569', linestyle='--', linewidth=1.5)
    ax.axvline(3.0, color='#991b1b', linestyle='--', linewidth=1.5)

    # Add text annotations for thresholds
    ax.text(0.5, 0.4, r'$\theta_{noise} = 0.5$', ha='right', va='bottom', fontsize=12, fontweight='bold', color='#1e293b', bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'))
    ax.text(3.0, 0.1, r'$\theta_{extreme} = 3.0$', ha='center', va='bottom', fontsize=12, fontweight='bold', color='#991b1b', bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'))

    # Formatting
    ax.set_title('Normal Distribution Curve of Log Risk Scores (Z-Score)', fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Z-Score', fontsize=12, fontweight='bold')
    ax.set_ylabel('Probability Density', fontsize=12, fontweight='bold')
    
    # Customizing axes
    ax.set_xticks(np.arange(-4, 5, 1))
    ax.set_yticks([]) # Hide Y ticks as they are not mathematically necessary for this illustration
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    ax.legend(loc='upper left', fontsize=11, framealpha=0.9)

    plt.tight_layout()
    plt.savefig('figure4_zscore_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Successfully generated: figure4_zscore_distribution.png")

if __name__ == "__main__":
    generate_figure_3()
    generate_figure_4()
