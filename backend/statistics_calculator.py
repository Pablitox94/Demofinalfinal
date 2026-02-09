from typing import List, Dict, Any, Optional
import statistics
from collections import Counter

class StatisticsCalculator:
    @staticmethod
    def calculate_frequency_table(data: List[Any]) -> Dict[str, Any]:
        counter = Counter(data)
        total = len(data)
        
        absolute_freq = dict(counter)
        relative_freq = {k: v/total for k, v in absolute_freq.items()}
        percentage_freq = {k: (v/total)*100 for k, v in absolute_freq.items()}
        
        return {
            "absoluteFrequency": absolute_freq,
            "relativeFrequency": relative_freq,
            "percentageFrequency": percentage_freq
        }
    
    @staticmethod
    def calculate_basic_stats(data: List[float]) -> Dict[str, Any]:
        if not data:
            return {}
        
        try:
            numeric_data = [float(x) for x in data if x is not None]
            
            if not numeric_data:
                return {}
            
            result = {
                "mean": statistics.mean(numeric_data),
                "median": statistics.median(numeric_data),
                "range": max(numeric_data) - min(numeric_data),
                "min": min(numeric_data),
                "max": max(numeric_data),
                "count": len(numeric_data)
            }
            
            try:
                result["mode"] = statistics.mode(numeric_data)
            except statistics.StatisticsError:
                result["mode"] = None
            
            if len(numeric_data) > 1:
                result["variance"] = statistics.variance(numeric_data)
                result["stdDev"] = statistics.stdev(numeric_data)
            
            return result
        except Exception as e:
            print(f"Error calculating statistics: {e}")
            return {}
    
    @staticmethod
    def calculate_advanced_stats(data: List[float]) -> Dict[str, Any]:
        basic = StatisticsCalculator.calculate_basic_stats(data)
        
        if not basic:
            return basic
        
        try:
            numeric_data = [float(x) for x in data if x is not None]
            
            if "mean" in basic and "stdDev" in basic and basic["mean"] != 0:
                basic["coefficientOfVariation"] = (basic["stdDev"] / basic["mean"]) * 100
            
            sorted_data = sorted(numeric_data)
            n = len(sorted_data)
            
            basic["q1"] = sorted_data[n // 4]
            basic["q3"] = sorted_data[3 * n // 4]
            basic["iqr"] = basic["q3"] - basic["q1"]
            
            return basic
        except Exception as e:
            print(f"Error calculating advanced statistics: {e}")
            return basic